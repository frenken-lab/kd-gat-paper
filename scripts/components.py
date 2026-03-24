"""Diagram component builders — NetworkX-based.

Returns (nx.DiGraph, positions, anchors) tuples.
Colors/sizes resolved from data/styles.yaml.
"""
from __future__ import annotations

from pathlib import Path

import networkx as nx
import numpy as np
import yaml

_STYLES = yaml.safe_load((Path(__file__).resolve().parent.parent / "data" / "styles.yaml").read_text())


# ---- Style resolution (shared with renderers) ----

def resolve_color(color: str) -> tuple[str, str]:
    """Resolve color name/role → (fill, stroke) hex pair."""
    if color in _STYLES.get("roles", {}):
        color = _STYLES["roles"][color]
    return _STYLES.get("fills", {}).get(color, color), _STYLES.get("palette", {}).get(color, color)


def resolve_hex(color: str) -> str:
    """Resolve color name/role → single hex."""
    return resolve_color(color)[1]


_SIZES = _STYLES.get("sizes", {})
_DEFAULT_GAP = _STYLES.get("layout", {}).get("gap", 1.5)


# ---- Layouts ----

_LAYOUTS = {
    "organic": lambda G: nx.rescale_layout_dict(nx.spring_layout(G, seed=42, k=1.5),
                                                 scale=max(1.0, len(G) * 0.3)),
    "linear": lambda G: {n: np.array([i * 0.6, 0.0]) for i, n in enumerate(G.nodes())},
    "grid": lambda G: {n: np.array([i % max(2, int(len(G) ** 0.5)),
                                     -(i // max(2, int(len(G) ** 0.5)))])
                        for i, n in enumerate(G.nodes())},
}


# ---- Edge patterns ----

def _edges(n: int, spec: str) -> list[tuple[int, int]]:
    if spec == "none": return []
    if spec == "full": return list(nx.complete_graph(n).edges())
    if spec == "ring": return list(nx.cycle_graph(n).edges())
    if spec == "path": return list(nx.path_graph(n).edges())
    if spec == "star": return list(nx.star_graph(n - 1).edges())
    if spec == "sparse":
        return list(nx.cycle_graph(n).edges()) + ([(0, n // 2)] if n > 3 else [])
    if "-" in spec:
        return [tuple(int(x) for x in e.split("-")) for e in spec.split(",")]
    return []


# ---- Bounding box ----

def _bbox(pos: dict) -> tuple[float, float, float, float]:
    coords = np.array(list(pos.values()))
    return coords[:, 0].min(), coords[:, 1].min(), coords[:, 0].max(), coords[:, 1].max()


# ---- Components ----

def graph(
    n: int = 5,
    layout: str = "organic",
    edges: str = "sparse",
    color: str = "blue",
    labels: list[str] | str = "auto",
    size: str | float = "medium",
    directed: bool = False,
    id: str = "g",
) -> tuple[nx.DiGraph, dict, dict]:
    """Graph component: nodes + edges + layout + anchors."""
    G = nx.DiGraph()
    fill, stroke = resolve_color(color)
    node_size = _SIZES.get(size, 400) if isinstance(size, str) else float(size)

    if labels == "auto":
        lbl = [f"$v_{{{i+1}}}$" for i in range(n)]
    elif labels == "none":
        lbl = [""] * n
    elif isinstance(labels, list):
        lbl = labels
    else:
        lbl = [""] * n

    named = isinstance(labels, list) and all(labels)
    nids = [f"{id}_{lab}" for lab in labels] if named else [f"{id}_{i}" for i in range(n)]

    for i in range(n):
        G.add_node(nids[i], label=lbl[i], fillcolor=fill, edgecolor=stroke, node_size=node_size)
    for s, d in _edges(n, edges):
        G.add_edge(nids[s], nids[d], color=f"{stroke}80", arrows=directed)

    pos = _LAYOUTS.get(layout, _LAYOUTS["organic"])(G)

    anchors = {"input": nids[0], "output": nids[-1], "all": nids, "bbox": _bbox(pos)}
    if named:
        for lab, nid in zip(labels, nids):
            anchors[lab] = nid
    return G, pos, anchors


def box(id: str, label: str = "", color: str = "grey") -> tuple[nx.DiGraph, dict, dict]:
    """Single process/operation node."""
    G = nx.DiGraph()
    fill, stroke = resolve_color(color)
    G.add_node(id, label=label, fillcolor=fill, edgecolor=stroke,
               node_size=_SIZES.get("large", 800), shape="s")
    pos = {id: np.array([0.0, 0.0])}
    return G, pos, {"self": id, "input": id, "output": id, "bbox": _bbox(pos)}


# ---- Model components ----

def gat(
    n_layers: int = 3,
    n: int = 5,
    edges: str = "sparse",
    color: str = "gat",
    size: str = "small",
    id: str = "gat",
    gap: float = 1.0,
) -> tuple[nx.DiGraph, dict, dict]:
    """GAT classifier: N attention layers → JK concat → FC."""
    parts = []
    layer_anchors = {}
    cursor_y = 0.0

    for i in range(n_layers):
        g, pos, anch = graph(n=n, layout="linear", edges=edges, color=color,
                             directed=True, size=size, labels="auto", id=f"{id}_L{i}")
        xmin, _, xmax, _ = _bbox(pos)
        pos = {k: v + np.array([-((xmin + xmax) / 2), cursor_y - gap]) for k, v in pos.items()}
        cursor_y = _bbox(pos)[1]
        layer_anchors[f"layer{i}"] = anch
        parts.append((g, pos))

    # JK + FC
    jk_g, jk_pos, jk_anch = box(id=f"{id}_jk", label="JK Concat", color=color)
    jk_pos = {k: v + np.array([0, cursor_y - gap]) for k, v in jk_pos.items()}
    cursor_y = _bbox(jk_pos)[1]
    parts.append((jk_g, jk_pos))

    fc_g, fc_pos, fc_anch = box(id=f"{id}_fc", label="FC → class", color=color)
    fc_pos = {k: v + np.array([0, cursor_y - gap]) for k, v in fc_pos.items()}
    parts.append((fc_g, fc_pos))

    # Compose + wire
    G = nx.compose_all([g for g, _ in parts])
    all_pos = {}
    for _, p in parts:
        all_pos.update(p)

    for i in range(1, n_layers):
        G.add_edge(layer_anchors[f"layer{i-1}"]["output"],
                   layer_anchors[f"layer{i}"]["input"], color="grey", style="dashed", arrows=True)
    for i in range(n_layers):
        G.add_edge(layer_anchors[f"layer{i}"]["output"],
                   jk_anch["input"], color="grey", style="dashed", arrows=True)
    G.add_edge(jk_anch["output"], fc_anch["input"], color="grey", arrows=True)

    anchors = {
        "input": layer_anchors["layer0"]["input"],
        "output": fc_anch["output"],
        "jk": jk_anch["self"],
        "fc": fc_anch["self"],
        "bbox": _bbox(all_pos),
    }
    for k, v in layer_anchors.items():
        anchors[k] = v

    return G, all_pos, anchors


def vgae(
    enc_layers: list[int] | None = None,
    color: str = "vgae",
    latent_n: int = 3,
    size: str = "small",
    id: str = "vgae",
    gap: float = 1.0,
) -> tuple[nx.DiGraph, dict, dict]:
    """VGAE autoencoder: GCN encoder → μ/σ → z → z^Tz → reconstructed."""
    if enc_layers is None:
        enc_layers = [5, 3]

    parts = []
    cursor_y = 0.0

    def _stack(g, pos):
        nonlocal cursor_y
        xmin, _, xmax, _ = _bbox(pos)
        pos = {k: v + np.array([-((xmin + xmax) / 2), cursor_y - gap]) for k, v in pos.items()}
        cursor_y = _bbox(pos)[1]
        parts.append((g, pos))
        return pos

    # Encoder layers
    enc_anchors = []
    for i, layer_n in enumerate(enc_layers):
        g, pos, anch = graph(n=layer_n, layout="linear", edges="full", color=color,
                             labels="none", size=size, id=f"{id}_e{i}")
        _stack(g, pos)
        enc_anchors.append(anch)

    # μ and σ side by side
    mu_labels = [f"μ{chr(0x2081 + i)}" for i in range(latent_n)]
    si_labels = [f"σ{chr(0x2081 + i)}" for i in range(latent_n)]

    mu_g, mu_pos, mu_anch = graph(n=latent_n, layout="linear", edges="none",
                                   color="purple", size=size, id=f"{id}_mu", labels=mu_labels)
    si_g, si_pos, si_anch = graph(n=latent_n, layout="linear", edges="none",
                                   color="purple", size=size, id=f"{id}_si", labels=si_labels)

    mu_w = _bbox(mu_pos)[2] - _bbox(mu_pos)[0]
    si_w = _bbox(si_pos)[2] - _bbox(si_pos)[0]
    total_w = mu_w + gap + si_w
    row_y = cursor_y - gap

    mu_pos = {k: v + np.array([-(total_w / 2) - _bbox(mu_pos)[0], row_y]) for k, v in mu_pos.items()}
    si_pos = {k: v + np.array([-(total_w / 2) + mu_w + gap - _bbox(si_pos)[0], row_y])
              for k, v in si_pos.items()}
    cursor_y = min(_bbox(mu_pos)[1], _bbox(si_pos)[1])
    parts.append((mu_g, mu_pos))
    parts.append((si_g, si_pos))

    # z
    z_labels = [f"z{chr(0x2081 + i)}" for i in range(latent_n)]
    z_g, z_pos, z_anch = graph(n=latent_n, layout="linear", edges="none",
                                color="dqn", size=size, id=f"{id}_z", labels=z_labels)
    _stack(z_g, z_pos)

    # Decoder box
    dec_g, dec_pos, dec_anch = box(id=f"{id}_dec", label="$z^T z$", color="grey")
    _stack(dec_g, dec_pos)

    # Reconstructed
    ro_g, ro_pos, ro_anch = graph(n=enc_layers[0], layout="linear", edges="full",
                                   color=color, labels="none", size=size, id=f"{id}_ro")
    _stack(ro_g, ro_pos)

    # Compose + wire
    G = nx.compose_all([g for g, _ in parts])
    all_pos = {}
    for _, p in parts:
        all_pos.update(p)

    for i in range(1, len(enc_layers)):
        G.add_edge(enc_anchors[i - 1]["output"], enc_anchors[i]["input"],
                   color="grey", style="dashed", arrows=True)
    G.add_edge(enc_anchors[-1]["output"], mu_anch["input"], color="grey", style="dashed", arrows=True)
    G.add_edge(enc_anchors[-1]["output"], si_anch["input"], color="grey", style="dashed", arrows=True)

    mid = latent_n // 2
    G.add_edge(mu_anch.get(mu_labels[mid], mu_anch["output"]),
               z_anch.get(z_labels[mid], z_anch["input"]), color="grey", arrows=True)
    G.add_edge(si_anch.get(si_labels[mid], si_anch["output"]),
               z_anch.get(z_labels[mid], z_anch["input"]), color="grey", arrows=True)
    G.add_edge(z_anch["output"], dec_anch["input"], color="grey", arrows=True)
    G.add_edge(dec_anch["output"], ro_anch["input"], color="grey", style="dashed", arrows=True)

    return G, all_pos, {
        "input": enc_anchors[0]["input"],
        "output": ro_anch["output"],
        "mu": mu_anch, "sigma": si_anch, "z": z_anch,
        "decoder": dec_anch["self"], "reconstructed": ro_anch,
        "bbox": _bbox(all_pos),
    }


# ---- Composition (spec interpreter) ----

_BUILDERS = {"graph": graph, "box": box, "gat": gat, "vgae": vgae}


def _resolve_anchor(ref: str, registry: dict[str, dict]) -> str | list[str]:
    """Resolve 'comp.anchor' → node ID(s)."""
    if "." not in ref:
        return ref
    comp_id, anchor = ref.split(".", 1)
    if comp_id not in registry:
        raise KeyError(f"Unknown component '{comp_id}'. Known: {list(registry.keys())}")
    anchors = registry[comp_id]
    if anchor not in anchors:
        raise KeyError(f"Unknown anchor '{anchor}' for '{comp_id}'. Known: {list(anchors.keys())}")
    return anchors[anchor]


def build_from_spec(spec: dict) -> tuple[nx.DiGraph, dict, list[dict]]:
    """Build a composed diagram from a YAML spec."""
    parts = []
    anchor_registry: dict[str, dict] = {}
    containers: list[dict] = []
    vertical = spec.get("direction", "horizontal") == "vertical"
    cursor = 0.0
    prev_bbox = None

    for comp in spec.get("components", []):
        g, pos, anchors = _BUILDERS[comp["type"]](**comp.get("params", {}))

        place = comp.get("place", {})

        if "offset" in comp and not place:
            pos = {k: v + np.array([comp["offset"].get("dx", 0), comp["offset"].get("dy", 0)])
                   for k, v in pos.items()}
        else:
            gap = place.get("gap", _DEFAULT_GAP)
            side = place.get("side", None)
            xmin, ymin, xmax, ymax = _bbox(pos)

            if vertical:
                if side and prev_bbox:
                    px_center = (prev_bbox[0] + prev_bbox[2]) / 2
                    width = xmax - xmin
                    dx = (px_center - width - gap / 2 - xmin) if side == "left" else (px_center + gap / 2 - xmin)
                    dy = cursor - gap - ymax
                else:
                    dx = -((xmin + xmax) / 2)
                    dy = cursor - gap - ymax
                pos = {k: v + np.array([dx, dy]) for k, v in pos.items()}
                if not (side and prev_bbox):
                    cursor = _bbox(pos)[1]
            else:
                dx = cursor + gap - xmin
                dy = place.get("dy", 0)
                pos = {k: v + np.array([dx, dy]) for k, v in pos.items()}
                cursor = _bbox(pos)[2]

        prev_bbox = _bbox(pos)
        comp_id = comp.get("params", {}).get("id", comp.get("type"))
        anchors["bbox"] = _bbox(pos)
        anchor_registry[comp_id] = anchors
        parts.append((g, pos))

        if "container" in comp:
            c = comp["container"]
            pad = c.get("pad", 0.4)
            bx = _bbox(pos)
            containers.append({
                "bbox": (bx[0] - pad, bx[1] - pad, bx[2] + pad, bx[3] + pad),
                "label": c.get("label", ""), "color": c.get("color", "grey"),
                "style": c.get("style", "dashed"),
            })

    # Compose all
    G = nx.compose_all([g for g, _ in parts])
    all_pos = {}
    for _, p in parts:
        all_pos.update(p)

    # Edges
    for edge in spec.get("edges", []):
        e = dict(edge)
        src = _resolve_anchor(e.pop("from"), anchor_registry)
        dst = _resolve_anchor(e.pop("to"), anchor_registry)
        srcs = src if isinstance(src, list) else [src]
        dsts = dst if isinstance(dst, list) else [dst]
        e.setdefault("color", "grey")
        e.setdefault("arrows", True)
        for s in srcs:
            for d in dsts:
                G.add_edge(s, d, **e)

    return G, all_pos, containers
