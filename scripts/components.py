"""Diagram component builders — pygraphviz-based.

Each component function mutates a shared AGraph by adding nodes,
edges, and subgraphs. Returns an anchors dict mapping anchor names
to node IDs.
"""
from __future__ import annotations

import itertools
from pathlib import Path

import pygraphviz as pgv
import yaml

_STYLES = yaml.safe_load(
    (Path(__file__).resolve().parent.parent / "data" / "styles.yaml").read_text()
)

# Pre-resolve all lookups into flat dicts. No wrapper functions needed.
_ROLES = _STYLES.get("roles", {})       # "vgae" → "blue"
_PALETTE = _STYLES.get("palette", {})    # "blue" → "#4E79A7"
_FILLS = _STYLES.get("fills", {})        # "blue" → "#DAE3EF"
_FONT = _STYLES.get("fonts", {}).get("serif", "serif")
_GAP = _STYLES.get("layout", {}).get("gap", 1.5)
_SIZES = {"small": "0.30", "medium": "0.60", "large": "1.20"}


def _color(name: str) -> str:
    """Role/palette name → stroke hex. One dict hop."""
    return _PALETTE.get(_ROLES.get(name, name), name)


def _fill(name: str) -> str:
    """Role/palette name → fill hex. One dict hop."""
    return _FILLS.get(_ROLES.get(name, name), name)


def _edges(n: int, spec: str) -> list[tuple[int, int]]:
    """Pattern name → index edge list. No library equivalent exists."""
    if spec == "none":
        return []
    if spec == "full":
        return list(itertools.combinations(range(n), 2))
    if spec == "ring":
        return [(i, (i + 1) % n) for i in range(n)]
    if spec == "path":
        return [(i, i + 1) for i in range(n - 1)]
    if spec == "star":
        return [(0, i) for i in range(1, n)]
    if spec == "sparse":
        return [(i, (i + 1) % n) for i in range(n)] + ([(0, n // 2)] if n > 3 else [])
    if "-" in spec:
        return [tuple(int(x) for x in e.split("-")) for e in spec.split(",")]
    return []


# ---- Components ----

def graph(
    G: pgv.AGraph,
    n: int = 5,
    layout: str = "organic",
    edges: str = "sparse",
    color: str = "blue",
    labels: list[str] | str = "auto",
    size: str | float = "medium",
    directed: bool = False,
    id: str = "g",
) -> dict:
    """Add a graph component (n nodes + edge pattern) to G."""
    fill, stroke = _fill(color), _color(color)
    w = _SIZES.get(size, "0.60") if isinstance(size, str) else f"{float(size) / 500:.2f}"

    if labels == "auto":
        lbl = [f"v{chr(0x2081 + i)}" for i in range(n)]
    elif isinstance(labels, list):
        lbl = list(labels)
    else:
        lbl = [""] * n

    named = isinstance(labels, list) and all(labels)
    nids = [f"{id}_{lab}" for lab in labels] if named else [f"{id}_{i}" for i in range(n)]

    for i in range(n):
        G.add_node(nids[i], label=lbl[i], fillcolor=fill, color=stroke,
                   width=w, height=w)

    for s, d in _edges(n, edges):
        G.add_edge(nids[s], nids[d], color=f"{stroke}80",
                   dir="forward" if directed else "none")

    anchors: dict = {"input": nids[0], "output": nids[-1], "all": nids,
                     "_all_nids": list(nids)}
    if named:
        for lab, nid in zip(labels, nids):
            anchors[lab] = nid
    return anchors


def box(G: pgv.AGraph, id: str, label: str = "", color: str = "grey") -> dict:
    """Add a single box node to G."""
    G.add_node(id, label=label, shape="box", style="filled,rounded",
               fillcolor=_fill(color), color=_color(color),
               fontsize="9", fixedsize="false")
    return {"self": id, "input": id, "output": id, "_all_nids": [id]}


def gat(
    G: pgv.AGraph,
    n_layers: int = 3,
    n: int = 5,
    edges: str = "sparse",
    color: str = "gat",
    size: str = "small",
    id: str = "gat",
    gap: float = 1.0,
) -> dict:
    """Add GAT classifier: N attention layers → JK Concat → FC."""
    fill, stroke = _fill(color), _color(color)
    w = _SIZES.get(size, "0.60")
    layer_anchors = {}
    all_nids = []

    for i in range(n_layers):
        lid = f"{id}_L{i}"
        nids = [f"{lid}_{j}" for j in range(n)]
        for j in range(n):
            G.add_node(nids[j], label=f"v{chr(0x2081 + j)}", fillcolor=fill,
                       color=stroke, width=w, height=w, fontsize="7")
        G.add_subgraph(nids, name=f"rank_{lid}", rank="same")
        for s, d in _edges(n, edges):
            G.add_edge(nids[s], nids[d], color=f"{stroke}80", dir="forward")
        all_nids.extend(nids)
        layer_anchors[f"layer{i}"] = {"input": nids[0], "output": nids[-1], "all": nids}

    for i in range(1, n_layers):
        G.add_edge(layer_anchors[f"layer{i-1}"]["output"],
                   layer_anchors[f"layer{i}"]["input"], style="dashed")

    jk_id = f"{id}_jk"
    G.add_node(jk_id, label="JK Concat", shape="box", style="filled,rounded",
               fillcolor=fill, color=stroke, fixedsize="false")
    all_nids.append(jk_id)
    for i in range(n_layers):
        G.add_edge(layer_anchors[f"layer{i}"]["output"], jk_id, style="dashed")

    fc_id = f"{id}_fc"
    G.add_node(fc_id, label="FC \u2192 class", shape="box", style="filled,rounded",
               fillcolor=fill, color=stroke, fixedsize="false")
    all_nids.append(fc_id)
    G.add_edge(jk_id, fc_id)

    anchors = {"input": layer_anchors["layer0"]["input"], "output": fc_id,
               "jk": jk_id, "fc": fc_id, "_all_nids": all_nids}
    anchors.update(layer_anchors)
    return anchors


def vgae(
    G: pgv.AGraph,
    enc_layers: list[int] | None = None,
    color: str = "vgae",
    latent_n: int = 3,
    size: str = "small",
    id: str = "vgae",
    gap: float = 1.0,
) -> dict:
    """Add VGAE autoencoder: encoder → μ/σ → z → zᵀz → reconstructed."""
    if enc_layers is None:
        enc_layers = [5, 3]
    fill, stroke = _fill(color), _color(color)
    w = _SIZES.get(size, "0.60")
    all_nids = []
    enc_anchors = []

    # Encoder layers
    for i, layer_n in enumerate(enc_layers):
        lid = f"{id}_e{i}"
        nids = [f"{lid}_{j}" for j in range(layer_n)]
        for j in range(layer_n):
            G.add_node(nids[j], label="", fillcolor=fill, color=stroke,
                       width=w, height=w)
        G.add_subgraph(nids, name=f"rank_{lid}", rank="same")
        for s, d in _edges(layer_n, "full"):
            G.add_edge(nids[s], nids[d], color=f"{stroke}80", dir="none")
        all_nids.extend(nids)
        enc_anchors.append({"input": nids[0], "output": nids[-1], "all": nids})

    for i in range(1, len(enc_layers)):
        G.add_edge(enc_anchors[i-1]["output"], enc_anchors[i]["input"], style="dashed")

    # μ and σ rows
    pf, ps = _fill("purple"), _color("purple")
    mu_nids = [f"{id}_mu_{j}" for j in range(latent_n)]
    si_nids = [f"{id}_si_{j}" for j in range(latent_n)]
    for j in range(latent_n):
        G.add_node(mu_nids[j], label=f"\u03bc{chr(0x2081+j)}", fillcolor=pf,
                   color=ps, width=w, height=w, fontsize="7")
        G.add_node(si_nids[j], label=f"\u03c3{chr(0x2081+j)}", fillcolor=pf,
                   color=ps, width=w, height=w, fontsize="7")
    all_nids.extend(mu_nids + si_nids)

    G.add_subgraph(mu_nids + si_nids, name=f"rank_{id}_mu_si", rank="same")
    for j in range(latent_n - 1):
        G.add_edge(mu_nids[j], mu_nids[j+1], style="invis")
        G.add_edge(si_nids[j], si_nids[j+1], style="invis")
    if mu_nids and si_nids:
        G.add_edge(mu_nids[-1], si_nids[0], style="invis", minlen="2")

    G.add_edge(enc_anchors[-1]["output"], mu_nids[0], style="dashed")
    G.add_edge(enc_anchors[-1]["output"], si_nids[0], style="dashed")

    # z row
    zf, zs = _fill("dqn"), _color("dqn")
    z_nids = [f"{id}_z_{j}" for j in range(latent_n)]
    for j in range(latent_n):
        G.add_node(z_nids[j], label=f"z{chr(0x2081+j)}", fillcolor=zf,
                   color=zs, width=w, height=w, fontsize="7")
    all_nids.extend(z_nids)
    G.add_subgraph(z_nids, name=f"rank_{id}_z", rank="same")

    mid = latent_n // 2
    G.add_edge(mu_nids[mid], z_nids[mid])
    G.add_edge(si_nids[mid], z_nids[mid])

    # Decoder box
    dec_id = f"{id}_dec"
    G.add_node(dec_id, label="z\u1d40z", shape="box", style="filled,rounded",
               fillcolor="#eeeeee", color="grey", fixedsize="false")
    all_nids.append(dec_id)
    G.add_edge(z_nids[-1], dec_id)

    # Reconstructed graph
    ro_n = enc_layers[0]
    ro_nids = [f"{id}_ro_{j}" for j in range(ro_n)]
    for j in range(ro_n):
        G.add_node(ro_nids[j], label="", fillcolor=fill, color=stroke,
                   width=w, height=w)
    G.add_subgraph(ro_nids, name=f"rank_{id}_ro", rank="same")
    for s, d in _edges(ro_n, "full"):
        G.add_edge(ro_nids[s], ro_nids[d], color=f"{stroke}80", dir="none")
    all_nids.extend(ro_nids)
    G.add_edge(dec_id, ro_nids[0], style="dashed")

    return {
        "input": enc_anchors[0]["input"], "output": ro_nids[-1],
        "mu": {"input": mu_nids[0], "output": mu_nids[-1], "all": mu_nids},
        "sigma": {"input": si_nids[0], "output": si_nids[-1], "all": si_nids},
        "z": {"input": z_nids[0], "output": z_nids[-1], "all": z_nids},
        "decoder": dec_id,
        "reconstructed": {"input": ro_nids[0], "output": ro_nids[-1], "all": ro_nids},
        "_all_nids": all_nids,
    }


# ---- Composition ----

_BUILDERS = {"graph": graph, "box": box, "gat": gat, "vgae": vgae}


def _resolve_anchor(ref: str, registry: dict[str, dict]) -> str | list[str]:
    """Resolve 'comp.anchor' or 'comp.sub.anchor' → node ID(s)."""
    if "." not in ref:
        return ref
    comp_id, anchor_path = ref.split(".", 1)
    if comp_id not in registry:
        raise KeyError(f"Unknown component '{comp_id}'. Known: {list(registry.keys())}")
    result = registry[comp_id]
    for key in anchor_path.split("."):
        if isinstance(result, dict) and key in result:
            result = result[key]
        else:
            raise KeyError(f"Unknown anchor '{anchor_path}' for '{comp_id}'")
    return result


def build_from_spec(spec: dict) -> pgv.AGraph:
    """Build a composed diagram from a YAML spec."""
    G = pgv.AGraph(
        directed=True, strict=False,
        rankdir="LR" if spec.get("direction") == "horizontal" else "TB",
        ranksep=str(spec.get("ranksep", _GAP)),
        nodesep=str(spec.get("nodesep", "0.4")),
        fontname=_FONT,
        bgcolor=spec.get("bgcolor", "transparent"),
        margin="0.2", compound="true", newrank="true",
    )
    G.node_attr.update(fontname=_FONT, fontsize="8", fontcolor="#333333",
                       shape="circle", style="filled", fixedsize="true")
    G.edge_attr.update(fontname=_FONT, fontsize="6", color="grey", arrowsize="0.5")

    anchor_registry: dict[str, dict] = {}
    n_comps = len(spec.get("components", []))

    for comp in spec.get("components", []):
        ctype = comp["type"]
        params = dict(comp.get("params", {}))
        comp_id = params.get("id", ctype)

        # Cluster subgraph: explicit container or auto-cluster for complex components
        if "container" in comp:
            c = comp["container"]
            cc = _color(c.get("color", "grey"))
            target = G.add_subgraph(
                name=f"cluster_{comp_id}", label=c.get("label", ""),
                style=c.get("style", "dashed"),
                color=f"{cc}60", bgcolor=f"{cc}10", fontcolor=f"{cc}90",
                fontsize="9", fontname=_FONT, labeljust="l",
            )
        elif n_comps > 1 and ctype in ("gat", "vgae"):
            target = G.add_subgraph(name=f"cluster_{comp_id}", label="",
                                    style="invis", color="transparent")
        else:
            target = G

        anchors = _BUILDERS[ctype](target, **params)

        # Constraint-based placement: invisible edge pulls student below teacher
        place = comp.get("place", {})
        if "below" in place and place["below"] in anchor_registry:
            G.add_edge(anchor_registry[place["below"]]["output"],
                       anchors["input"], style="invis", minlen="1")

        anchors.pop("_all_nids", None)
        anchor_registry[comp_id] = anchors

    # Inter-component edges from spec
    for edge in spec.get("edges", []):
        e = dict(edge)
        src = _resolve_anchor(e.pop("from"), anchor_registry)
        dst = _resolve_anchor(e.pop("to"), anchor_registry)
        srcs = src if isinstance(src, list) else [src]
        dsts = dst if isinstance(dst, list) else [dst]

        gv: dict[str, str] = {}
        if "color" in e:
            raw = e["color"]
            gv["color"] = raw if raw.startswith("#") else _color(raw)
        for k, gk in [("style", "style"), ("width", "penwidth"), ("constraint", "constraint")]:
            if k in e:
                gv[gk] = str(e[k]).lower() if k == "constraint" else str(e[k])
        if "label" in e:
            gv["label"] = e["label"]
            gv["fontcolor"] = "grey"

        for s in srcs:
            for d in dsts:
                G.add_edge(s, d, **gv)

    return G
