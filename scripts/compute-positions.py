#!/usr/bin/env python3
"""Compute organic node positions for diagram YAML specs.

One-shot dev tool. Run once, copy positions into YAML specs.
Positions are in inches (neato/fdp native units).

Usage:
    python scripts/compute-positions.py
"""
import pygraphviz as pgv
import itertools


def compute(n: int, edges: str, label: str = "") -> list[list[float]]:
    """Compute organic positions for n nodes with given edge pattern."""
    G = pgv.AGraph(strict=False)
    for i in range(n):
        G.add_node(str(i))

    if edges == "full":
        for i, j in itertools.combinations(range(n), 2):
            G.add_edge(str(i), str(j))
    elif edges == "sparse":
        for i in range(n):
            G.add_edge(str(i), str((i + 1) % n))
        if n > 3:
            G.add_edge("0", str(n // 2))
    elif edges == "path":
        for i in range(n - 1):
            G.add_edge(str(i), str(i + 1))
    elif edges == "none":
        pass

    G.layout(prog="neato")

    positions = []
    for i in range(n):
        node = G.get_node(str(i))
        x, y = node.attr["pos"].split(",")
        positions.append([round(float(x) / 72, 2), round(float(y) / 72, 2)])
    return positions


def print_yaml(name: str, positions: list[list[float]]):
    print(f"# {name}")
    for p in positions:
        print(f"  - [{p[0]}, {p[1]}]")
    print()


if __name__ == "__main__":
    configs = [
        ("sparse_5", 5, "sparse"),
        ("full_5", 5, "full"),
        ("full_3", 3, "full"),
        ("sparse_3", 3, "sparse"),
        ("path_3", 3, "path"),
        ("none_3", 3, "none"),
    ]
    for name, n, edges in configs:
        positions = compute(n, edges, name)
        print_yaml(name, positions)
