"""Diagram renderers — (graph, positions) → output file."""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import networkx as nx

from components import resolve_hex


def render_matplotlib(
    G: nx.DiGraph,
    pos: dict,
    output: Path,
    figsize: tuple[float, float] = (12, 4),
    font_size: int = 8,
    title: str = "",
    containers: list[dict] | None = None,
) -> Path:
    fig, ax = plt.subplots(1, 1, figsize=figsize)
    ax.set_aspect("equal")
    ax.axis("off")
    if title:
        ax.set_title(title, fontsize=12)

    # Container boxes (behind everything)
    for c in (containers or []):
        xmin, ymin, xmax, ymax = c["bbox"]
        color = resolve_hex(c.get("color", "grey"))
        ax.add_patch(mpatches.FancyBboxPatch(
            (xmin, ymin), xmax - xmin, ymax - ymin,
            boxstyle="round,pad=0.1",
            facecolor=f"{color}10", edgecolor=f"{color}60",
            linestyle="--" if c.get("style") == "dashed" else "-",
            linewidth=1.0, zorder=0,
        ))
        if c.get("label"):
            ax.text(xmin + 0.15, ymax - 0.15, c["label"],
                    fontsize=7, color=f"{color}90", va="top", fontstyle="italic")

    node_sizes = list(nx.get_node_attributes(G, "node_size").values()) or 300

    # Edges — group by (directed, style, connectionstyle, arrowstyle)
    # since matplotlib needs uniform values for these per draw call
    edge_groups: dict[tuple, list] = {}
    for u, v, d in G.edges(data=True):
        key = (
            d.get("arrows", True),
            d.get("style", "solid"),
            d.get("connectionstyle", "arc3"),
            d.get("arrowstyle", None),
        )
        edge_groups.setdefault(key, []).append((u, v))

    for (arrows, style, connstyle, arrstyle), elist in edge_groups.items():
        kwargs = dict(
            edge_color=[G.edges[u, v].get("color", "#88888880") for u, v in elist],
            width=[G.edges[u, v].get("width", 1.0) for u, v in elist],
            alpha=0.6, arrows=arrows, arrowsize=10,
            node_size=node_sizes, style=style,
            connectionstyle=connstyle,
        )
        if arrstyle:
            kwargs["arrowstyle"] = arrstyle
        nx.draw_networkx_edges(G, pos, edgelist=elist, ax=ax, **kwargs)

    # Nodes — group by shape since matplotlib needs uniform shape per call
    for shape in set(nx.get_node_attributes(G, "shape").values()) | {"o"}:
        nlist = [n for n in G.nodes() if G.nodes[n].get("shape", "o") == shape]
        if not nlist:
            continue
        nx.draw_networkx_nodes(
            G, pos, nodelist=nlist, ax=ax,
            node_color=[G.nodes[n].get("fillcolor", "#DAE3EF") for n in nlist],
            edgecolors=[G.nodes[n].get("edgecolor", "grey") for n in nlist],
            node_size=[G.nodes[n].get("node_size", 300) for n in nlist],
            node_shape=shape, linewidths=1.0,
        )

    # Labels
    node_labels = nx.get_node_attributes(G, "label")
    node_labels = {k: v for k, v in node_labels.items() if v}
    if node_labels:
        nx.draw_networkx_labels(G, pos, labels=node_labels, ax=ax, font_size=font_size)

    edge_labels = nx.get_edge_attributes(G, "label")
    if edge_labels:
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, ax=ax,
                                     font_size=6, font_color="grey")

    plt.tight_layout()
    fig.savefig(str(output), format=output.suffix.lstrip("."),
                bbox_inches="tight", transparent=True, dpi=200)
    plt.close(fig)
    return output


def export_positions(pos: dict, output: Path) -> Path:
    """Export positions as JSON for Typst label layer."""
    data = {n: {"x": float(p[0]), "y": float(p[1])} for n, p in pos.items()}
    output.write_text(json.dumps(data, indent=2))
    return output
