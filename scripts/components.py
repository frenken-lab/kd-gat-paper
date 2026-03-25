"""YAML spec → pygraphviz AGraph. Two primitives: graph() and box().
Layout via neato with pinned positions. Styles from data/styles.yaml."""
from __future__ import annotations

import itertools
from pathlib import Path

import pygraphviz as pgv
import yaml

_STYLES = yaml.safe_load(
    (Path(__file__).resolve().parent.parent / "data" / "styles.yaml").read_text()
)
_ROLES = _STYLES.get("roles", {})
_PALETTE = _STYLES.get("palette", {})
_FILLS = _STYLES.get("fills", {})
_FONT = _STYLES.get("fonts", {}).get("serif", "serif")
_GAP = _STYLES.get("layout", {}).get("gap", 1.5)
_SIZES = {"small": "0.30", "medium": "0.60", "large": "1.20"}


def _color(name: str) -> str:
    return _PALETTE.get(_ROLES.get(name, name), name)


def _fill(name: str) -> str:
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


def graph(G: pgv.AGraph, n: int = 5, edges: str = "sparse", color: str = "blue",
          labels: list[str] | str = "auto", size: str = "medium",
          directed: bool = False, id: str = "g",
          positions: list[list[float]] | None = None) -> dict:
    """Add n nodes + edge pattern to G. Returns anchor dict."""
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

    anchors: dict = {"input": nids[0], "output": nids[-1], "all": nids}
    if named:
        for lab, nid in zip(labels, nids):
            anchors[lab] = nid
    return anchors


def box(G: pgv.AGraph, id: str, label: str = "", color: str = "grey") -> dict:
    """Add a single box node to G."""
    G.add_node(id, label=label, shape="box", style="filled,rounded",
               fillcolor=_fill(color), color=_color(color),
               fontsize="9", fixedsize="false")
    return {"self": id, "input": id, "output": id}


_BUILDERS = {"graph": graph, "box": box}


def build_from_spec(spec: dict) -> pgv.AGraph:
    """Build a composed diagram from a YAML spec."""
    G = pgv.AGraph(
        directed=True, strict=False,
        rankdir="LR" if spec.get("direction") == "horizontal" else "TB",
        ranksep=str(spec.get("ranksep", _GAP)),
        nodesep=str(spec.get("nodesep", "0.4")),
        fontname=_FONT, bgcolor=spec.get("bgcolor", "transparent"),
        margin="0.2", compound="true", newrank="true",
    )
    G.node_attr.update(fontname=_FONT, fontsize="8", fontcolor="#333333",
                       shape="circle", style="filled", fixedsize="true")
    G.edge_attr.update(fontname=_FONT, fontsize="6", color="grey", arrowsize="0.5")

    registry: dict[str, dict] = {}

    for comp in spec.get("components", []):
        ctype = comp["type"]
        params = dict(comp.get("params", {}))
        comp_id = params.get("id", ctype)

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

        registry[comp_id] = _BUILDERS[ctype](target, **params)

    def resolve(ref: str) -> str | list[str]:
        if "." not in ref:
            return ref
        comp_id, path = ref.split(".", 1)
        result = registry[comp_id]
        for key in path.split("."):
            result = result[key]
        return result

    for edge in spec.get("edges", []):
        e = dict(edge)
        src = resolve(e.pop("from"))
        dst = resolve(e.pop("to"))

        gv: dict[str, str] = {}
        if "color" in e:
            raw = e["color"]
            gv["color"] = raw if raw.startswith("#") else _color(raw)
        for k, gk in [("style", "style"), ("width", "penwidth"),
                      ("constraint", "constraint"), ("ltail", "ltail"), ("lhead", "lhead")]:
            if k in e:
                gv[gk] = str(e[k]).lower() if k == "constraint" else str(e[k])
        if "label" in e:
            gv["label"] = e["label"]
            gv["fontcolor"] = "grey"

        for s in (src if isinstance(src, list) else [src]):
            for d in (dst if isinstance(dst, list) else [dst]):
                G.add_edge(s, d, **gv)

    return G
