"""Diagram component builders — pygraphviz-based.

Two primitives: graph() and box(). All diagram structure is declared
in YAML specs. Layout via neato with pinned positions.
"""
from __future__ import annotations

import itertools
from pathlib import Path

import pygraphviz as pgv
import yaml

_STYLES = yaml.safe_load(
    (Path(__file__).resolve().parent.parent / "data" / "styles.yaml").read_text()
)

# Pre-resolve all lookups into flat dicts.
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
    """Pattern name → index edge list."""
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
    edges: str = "sparse",
    color: str = "blue",
    labels: list[str] | str = "auto",
    size: str = "medium",
    directed: bool = False,
    id: str = "g",
    positions: list[list[float]] | None = None,
) -> dict:
    """Add a graph component (n nodes + edge pattern) to G."""
    fill, stroke = _fill(color), _color(color)
    w = _SIZES.get(size, "0.60")

    if labels == "auto":
        lbl = [f"v{chr(0x2081 + i)}" for i in range(n)]
    elif isinstance(labels, list):
        lbl = list(labels)
    else:
        lbl = [""] * n

    named = isinstance(labels, list) and all(labels)
    nids = [f"{id}_{lab}" for lab in labels] if named else [f"{id}_{i}" for i in range(n)]

    for i in range(n):
        attrs: dict[str, str] = {"label": lbl[i], "fillcolor": fill, "color": stroke,
                                 "width": w, "height": w}
        if positions and i < len(positions):
            attrs["pos"] = f"{positions[i][0]},{positions[i][1]}!"
            attrs["pin"] = "true"
        G.add_node(nids[i], **attrs)

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


# ---- Composition ----

_BUILDERS = {"graph": graph, "box": box}


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

    for comp in spec.get("components", []):
        ctype = comp["type"]
        params = dict(comp.get("params", {}))
        comp_id = params.get("id", ctype)

        # Cluster subgraph from explicit container spec
        if "container" in comp:
            c = comp["container"]
            cc = _color(c.get("color", "grey"))
            target = G.add_subgraph(
                name=f"cluster_{comp_id}", label=c.get("label", ""),
                style=c.get("style", "dashed"),
                color=f"{cc}60", bgcolor=f"{cc}10", fontcolor=f"{cc}90",
                fontsize="9", fontname=_FONT, labeljust="l",
            )
        else:
            target = G

        anchors = _BUILDERS[ctype](target, **params)

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
        for k, gk in [("style", "style"), ("width", "penwidth"), ("constraint", "constraint"),
                      ("ltail", "ltail"), ("lhead", "lhead")]:
            if k in e:
                gv[gk] = str(e[k]).lower() if k == "constraint" else str(e[k])
        if "label" in e:
            gv["label"] = e["label"]
            gv["fontcolor"] = "grey"

        for s in srcs:
            for d in dsts:
                G.add_edge(s, d, **gv)

    return G
