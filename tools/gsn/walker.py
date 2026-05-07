#!/usr/bin/env python3
"""Walk the GSN-conformant argument DAG and report gap inventory.

Reads `data/gsn/gsn-dag.yaml`. Validates GSN schema conformance
(SupportedBy / InContextOf permitted-target rules; element-count vs
declared scope; no orphan Strategies; resolved cross-references). Then
runs the gap walker from the top Goal `C-thesis` and prints the structural
gaps (undeveloped Goals + open Strategies on the critical path).

Exits non-zero on schema violations or unresolved references; zero on a
clean run regardless of gap count (gaps are research progress, not errors).

Usage:
    uv run python tools/gsn/walker.py
    make gsn
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
YAML_PATH = ROOT / "data" / "gsn" / "gsn-dag.yaml"

# Per SCSC GSN Community Standard v3 (2021):
#   - Solutions and Contexts are leaves; their statements close on identity.
#   - Goals close iff at least one supporting Strategy/Solution closes.
#   - Strategies close iff every SupportedBy child closes AND undeveloped is false.
CLOSED_TYPES: set[str] = {"Solution", "Context"}
SUPPORTEDBY_TARGETS: set[str] = {"Goal", "Strategy", "Solution"}
INCONTEXTOF_TARGETS: set[str] = {"Context", "Assumption", "Justification"}


def load() -> dict:
    if not YAML_PATH.exists():
        sys.stderr.write(f"ERROR: {YAML_PATH} not found\n")
        sys.exit(1)
    with open(YAML_PATH) as f:
        return yaml.safe_load(f)


def validate(doc: dict) -> list[str]:
    """Schema-conformance checks. Returns a list of error strings."""
    errors: list[str] = []
    elements = {e["id"]: e for e in doc.get("elements", [])}
    links = doc.get("links", [])

    # Declared vs actual element counts
    actual = Counter(e["type"] for e in doc["elements"])
    declared = doc.get("module", {}).get("scope", {})
    for key, type_name in [
        ("goals", "Goal"),
        ("strategies", "Strategy"),
        ("solutions", "Solution"),
        ("contexts", "Context"),
    ]:
        if key in declared and actual[type_name] != declared[key]:
            errors.append(f"scope.{key} declared {declared[key]}, actual count {actual[type_name]}")

    # Link references resolve
    for link in links:
        if link["from"] not in elements:
            errors.append(f"link from {link['from']!r} -> {link['to']!r}: unknown 'from'")
        if link["to"] not in elements:
            errors.append(f"link from {link['from']!r} -> {link['to']!r}: unknown 'to'")

    # Instantiates references resolve
    for elem in doc["elements"]:
        target = elem.get("instantiates")
        if target is not None and target not in elements:
            errors.append(f"element {elem['id']} instantiates unknown {target!r}")

    # Permitted target types per link kind
    for link in links:
        target = elements.get(link["to"])
        if target is None:
            continue
        if link["type"] == "SupportedBy" and target["type"] not in SUPPORTEDBY_TARGETS:
            errors.append(
                f"SupportedBy {link['from']} -> {link['to']} ({target['type']}): "
                f"only {sorted(SUPPORTEDBY_TARGETS)} allowed"
            )
        if link["type"] == "InContextOf" and target["type"] not in INCONTEXTOF_TARGETS:
            errors.append(
                f"InContextOf {link['from']} -> {link['to']} ({target['type']}): "
                f"only {sorted(INCONTEXTOF_TARGETS)} allowed"
            )

    # Strategies must have at least one SupportedBy supporter (no dead Strategies)
    supporters: dict[str, list[str]] = {}
    for link in links:
        if link["type"] == "SupportedBy":
            supporters.setdefault(link["from"], []).append(link["to"])
    for elem in doc["elements"]:
        if elem["type"] == "Strategy" and not supporters.get(elem["id"]):
            errors.append(f"Strategy {elem['id']} has no SupportedBy children (orphan)")

    return errors


def report_gaps(doc: dict, start: str = "C-thesis") -> list[str]:
    """Walk back from `start` and emit gap lines."""
    elements = {e["id"]: e for e in doc["elements"]}
    links = doc["links"]
    supporters: dict[str, list[str]] = {}
    for link in links:
        if link["type"] == "SupportedBy":
            supporters.setdefault(link["from"], []).append(link["to"])

    memo: dict[str, bool] = {}

    def is_closed(eid: str) -> bool:
        if eid in memo:
            return memo[eid]
        memo[eid] = False
        elem = elements[eid]
        if elem.get("undeveloped", False):
            return False
        kind = elem["type"]
        if kind in CLOSED_TYPES:
            memo[eid] = True
            return True
        if kind == "Strategy":
            sup = supporters.get(eid, [])
            if not sup:
                return False
            for child in sup:
                if not is_closed(child):
                    return False
            memo[eid] = True
            return True
        if kind == "Goal":
            for child in supporters.get(eid, []):
                if is_closed(child):
                    memo[eid] = True
                    return True
        return False

    out: list[str] = []
    seen: set[str] = set()

    def walk(eid: str) -> None:
        if eid in seen or is_closed(eid):
            return
        seen.add(eid)
        elem = elements[eid]
        if elem["type"] == "Goal" and elem.get("undeveloped"):
            label = elem["statement"].split(" — ")[0][:60]
            out.append(f"GAP (undeveloped goal): {eid} — {label}")
            return
        if elem["type"] == "Strategy" and elem.get("undeveloped"):
            parent = next(
                (
                    link["from"]
                    for link in links
                    if link["type"] == "SupportedBy" and link["to"] == eid
                ),
                None,
            )
            out.append(f"GAP (open strategy {eid} -> {parent})")
        for child in supporters.get(eid, []):
            if not is_closed(child):
                walk(child)

    walk(start)
    return out


def main() -> int:
    doc = load()
    elements = doc["elements"]
    links = doc["links"]

    counts = Counter(e["type"] for e in elements)
    sb = sum(1 for link in links if link["type"] == "SupportedBy")
    ic = sum(1 for link in links if link["type"] == "InContextOf")
    print(f"Elements: {dict(counts)} (total {sum(counts.values())})")
    print(f"Links: {len(links)} ({sb} SupportedBy, {ic} InContextOf)")

    errors = validate(doc)
    if errors:
        sys.stderr.write("Schema errors:\n")
        for err in errors:
            sys.stderr.write(f"  {err}\n")
        return 1

    print()
    print("Gap inventory:")
    gaps = report_gaps(doc)
    if not gaps:
        print("  (none — argument fully closed)")
    for line in gaps:
        print(f"  {line}")

    print()
    print("Schema clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
