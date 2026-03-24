#!/usr/bin/env python3
"""Build diagrams from YAML specs → figures/.

Usage:
    python scripts/build-diagrams.py              # build all
    python scripts/build-diagrams.py vgae          # build one
    python scripts/build-diagrams.py --fmt pdf
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import yaml
from components import build_from_spec

DIAGRAMS = Path(__file__).resolve().parent.parent / "diagrams"
FIGURES = Path(__file__).resolve().parent.parent / "figures"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("names", nargs="*")
    parser.add_argument("--fmt", default="svg")
    args = parser.parse_args()
    FIGURES.mkdir(exist_ok=True)

    specs = sorted(DIAGRAMS.glob("*.yaml"))
    if args.names:
        specs = [s for s in specs if s.stem in args.names]

    for path in specs:
        spec = yaml.safe_load(path.read_text())
        G = build_from_spec(spec)

        out = FIGURES / f"{path.stem}.{args.fmt}"
        prog = spec.get("prog", "dot")
        G.draw(str(out), prog=prog)
        print(f"  {path.name} → {out.name}")


if __name__ == "__main__":
    main()
