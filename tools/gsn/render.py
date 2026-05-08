#!/usr/bin/env python3
"""Convert the GSN argument DAG to SvelteFlow-compatible JSON.

Reads `data/gsn/gsn-dag.yaml`. Validates schema conformance via walker.py.
Emits `nodes[] + edges[]` matching SvelteFlow's `Node` / `Edge` types,
ready for an App.svelte to import + lay out via ELK in-browser.

Output schema (flat, single JSON file):

    {
      "nodes": [
        {
          "id": "C-thesis",
          "type": "gsnGoal",       // SvelteFlow node-component name
          "position": {"x": 0, "y": 0},  // placeholder; ELK overwrites
          "data": {
            "statement": "...",
            "undeveloped": false,
            "layer": "thesis",
            "citations": [...],     // when present
            "instantiates": "...",  // when present
            "formal_object": true   // when present
          }
        },
        ...
      ],
      "edges": [
        {
          "id": "e0",
          "source": "S-thesis",     // supporter / context-source
          "target": "C-thesis",     // supported / context-attached
          "type": "supportedBy",    // SvelteFlow edge-component name
          "data": {"linkType": "SupportedBy"}
        },
        ...
      ]
    }

Edge direction:
- SupportedBy in the YAML reads `{from: <supported>, to: <supporter>}`. The
  visual GSN arrow points UP from the supporter to the supported, so we
  flip: `source = link.to`, `target = link.from`.
- InContextOf in the YAML reads `{from: <goal>, to: <context>}`. The visual
  arrow points OUT to the Context, so we keep direction:
  `source = link.from`, `target = link.to`.

Usage:
    uv run python tools/gsn/render.py
    uv run python tools/gsn/render.py --output interactive/src/figures/diagrams/gsn-thesis/data.json
    make gsn-render
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
YAML_PATH = ROOT / "data" / "gsn" / "gsn-dag.yaml"
DEFAULT_OUTPUT = ROOT / "data" / "gsn" / "gsn-flow.json"

# All GSN nodes ride on the existing ContainerNode component (registered as
# `container` in DiagramCanvas). Visual variation is via the `shape` data
# field — ContainerNode handles rectangle / rounded-rectangle / trapezoid
# variants today; parallelogram / circle / stadium / oval are the additions
# documented in interactive/src/lib/flow/nodes/ContainerNode.svelte.
GSN_TO_SHAPE = {
    "Goal": "rectangle",
    "Strategy": "parallelogram",
    "Solution": "circle",
    "Context": "stadium",  # rounded-rectangle with high border-radius
    "Assumption": "oval",
    "Justification": "oval",
}

# SvelteFlow native arrowheads — no custom edge components needed.
# https://reactflow.dev/api-reference/types/marker (xyflow shares MarkerType).
EDGE_MARKER = {
    "SupportedBy": "arrowclosed",
    "InContextOf": "arrow",
}


def load_yaml() -> dict:
    if not YAML_PATH.exists():
        sys.stderr.write(f"ERROR: {YAML_PATH} not found\n")
        sys.exit(1)
    with open(YAML_PATH) as f:
        return yaml.safe_load(f)


def _short_label(elem: dict) -> str:
    """First 5 words of statement, ellipsis-capped; fall back to element id."""
    statement = elem.get("statement", "")
    words = statement.split()
    if not words:
        return elem.get("id", "")
    label = " ".join(words[:5])
    return label + "…" if len(words) > 5 else label


def build_node(elem: dict) -> dict:
    """Map one YAML element to a SvelteFlow node record (single ContainerNode type)."""
    gsn_type = elem["type"]
    if gsn_type not in GSN_TO_SHAPE:
        raise ValueError(f"unknown element type {gsn_type!r} on id {elem.get('id')}")

    data: dict = {
        "label": _short_label(elem),
        "statement": elem.get("statement", ""),
        "shape": GSN_TO_SHAPE[gsn_type],
        "gsnType": gsn_type,
        "undeveloped": bool(elem.get("undeveloped", False)),
    }
    # Carry through optional annotations the Svelte side may use for styling
    # (color by layer, citation badge, instance↔thesis hover, etc.).
    for opt in ("layer", "citations", "instantiates", "formal_object"):
        if opt in elem:
            data[opt] = elem[opt]

    return {
        "id": elem["id"],
        "type": "container",  # all GSN nodes share ContainerNode
        "position": {"x": 0, "y": 0},
        "data": data,
    }


def build_edge(link: dict, idx: int) -> dict:
    """Map one YAML link to a SvelteFlow edge record (default edge + markerEnd)."""
    link_type = link["type"]
    if link_type not in EDGE_MARKER:
        raise ValueError(f"unknown link type {link_type!r} at index {idx}")

    if link_type == "SupportedBy":
        # YAML: from=supported, to=supporter. SvelteFlow: source=supporter, target=supported.
        source, target = link["to"], link["from"]
    else:  # InContextOf — direction preserved
        source, target = link["from"], link["to"]

    return {
        "id": f"e{idx}",
        "source": source,
        "target": target,
        "type": "smoothstep",
        "markerEnd": {"type": EDGE_MARKER[link_type]},
        "data": {"linkType": link_type},
    }


def convert(doc: dict) -> dict:
    nodes = [build_node(e) for e in doc.get("elements", [])]
    edges = [build_edge(l, i) for i, l in enumerate(doc.get("links", []))]
    return {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "source": str(YAML_PATH.relative_to(ROOT)),
            "module": doc.get("module", {}).get("id"),
            "scope": doc.get("module", {}).get("scope"),
            "gaps": doc.get("module", {}).get("gaps"),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output JSON path (default: {DEFAULT_OUTPUT.relative_to(ROOT)})",
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Skip schema validation (assumes walker.py was run separately)",
    )
    args = parser.parse_args()

    doc = load_yaml()

    if not args.no_validate:
        # Reuse walker.py's schema checks. Import lazily so render.py works
        # standalone if walker.py is missing.
        sys.path.insert(0, str(Path(__file__).parent))
        from walker import validate as walker_validate  # type: ignore[import]

        errors = walker_validate(doc)
        if errors:
            sys.stderr.write("Schema errors (run `make gsn` for details):\n")
            for err in errors:
                sys.stderr.write(f"  {err}\n")
            return 1

    flow = convert(doc)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(flow, f, indent=2)
        f.write("\n")

    rel = args.output.relative_to(ROOT) if args.output.is_relative_to(ROOT) else args.output
    print(f"Wrote {rel}: {len(flow['nodes'])} nodes, {len(flow['edges'])} edges")
    return 0


if __name__ == "__main__":
    sys.exit(main())
