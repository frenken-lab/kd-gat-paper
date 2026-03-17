#!/usr/bin/env python3
"""Validate references.bib for missing fields, duplicates, and empty values.

Usage:
    python scripts/validate_bib.py
    python scripts/validate_bib.py --strict  # Treat warnings as errors
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BIB_PATH = Path(__file__).resolve().parent.parent / "references.bib"

REQUIRED = {
    "article": ["author", "title", "journal", "year"],
    "inproceedings": ["author", "title", "booktitle", "year"],
    "book": ["author", "title", "publisher", "year"],
}


def parse_entries(text: str) -> list[dict]:
    entries = []
    for m in re.finditer(r"@(\w+)\s*\{([^,]+),", text):
        etype, key = m.group(1).lower(), m.group(2).strip()
        # Find matching closing brace (handle nesting)
        start = m.end()
        depth, i = 1, start
        while i < len(text) and depth > 0:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        body = text[start : i - 1]
        fields = {
            fm.group(1).lower(): fm.group(2).strip()
            for fm in re.finditer(r"(\w+)\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}", body)
        }
        entries.append({"type": etype, "key": key, "fields": fields})
    return entries


def main() -> None:
    strict = "--strict" in sys.argv
    text = BIB_PATH.read_text()
    entries = parse_entries(text)
    print(f"Parsed {len(entries)} entries")

    errors, warnings = [], []

    # Duplicate keys
    seen = set()
    for e in entries:
        if e["key"] in seen:
            errors.append(f"Duplicate: {e['key']}")
        seen.add(e["key"])

    # Required fields
    for e in entries:
        if e["type"] in ("comment", "string"):
            continue
        for f in REQUIRED.get(e["type"], ["title"]):
            if f not in e["fields"] or not e["fields"][f]:
                errors.append(f"[{e['key']}] missing: {f}")
        if "doi" not in e["fields"] and e["type"] in ("article", "inproceedings"):
            warnings.append(f"[{e['key']}] no DOI")

    for w in warnings:
        print(f"WARN: {w}")
    for e in errors:
        print(f"ERROR: {e}")

    n = len(errors) + (len(warnings) if strict else 0)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if n > 0 else 0)


if __name__ == "__main__":
    main()
