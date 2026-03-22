#!/usr/bin/env python3
"""Validate references.bib for missing fields, duplicates, and empty values.

Usage:
    python scripts/validate_bib.py
    python scripts/validate_bib.py --strict  # Treat warnings as errors
"""

from __future__ import annotations

import sys
from pathlib import Path

import bibtexparser

BIB_PATH = Path(__file__).resolve().parent.parent / "references.bib"

REQUIRED_FIELDS: dict[str, list[str]] = {
    "article": ["author", "title", "journal", "year"],
    "inproceedings": ["author", "title", "booktitle", "year"],
    "book": ["author", "title", "publisher", "year"],
    "incollection": ["author", "title", "booktitle", "publisher", "year"],
    "phdthesis": ["author", "title", "school", "year"],
    "mastersthesis": ["author", "title", "school", "year"],
    "techreport": ["author", "title", "institution", "year"],
    "misc": ["title"],
}


def main() -> None:
    strict = "--strict" in sys.argv

    library = bibtexparser.parse_file(BIB_PATH)
    print(f"Parsed {len(library.entries)} entries")

    if library.failed_blocks:
        print(f"WARNING: {len(library.failed_blocks)} block(s) failed to parse")
        for block in library.failed_blocks:
            print(f"  - {block.raw[:60]}...")

    errors: list[str] = []
    warnings: list[str] = []

    # Check for duplicate keys
    seen_keys: set[str] = set()
    for entry in library.entries:
        if entry.key in seen_keys:
            errors.append(f"Duplicate key: {entry.key}")
        seen_keys.add(entry.key)

    # Validate required fields per entry type
    for entry in library.entries:
        entry_type = entry.entry_type.lower()
        fields = entry.fields_dict

        required = REQUIRED_FIELDS.get(entry_type, ["title"])
        for field_name in required:
            field = fields.get(field_name)
            if field is None or not field.value.strip():
                errors.append(f"[{entry.key}] missing required field: {field_name}")

        # Warn on missing DOI for articles/proceedings
        if entry_type in ("article", "inproceedings") and "doi" not in fields:
            warnings.append(f"[{entry.key}] no DOI")

        # Warn on missing URL when no DOI
        if "doi" not in fields and "url" not in fields:
            if entry_type in ("misc", "online"):
                warnings.append(f"[{entry.key}] no DOI or URL")

    # Print results
    for w in warnings:
        print(f"WARN: {w}")
    for e in errors:
        print(f"ERROR: {e}")

    n_issues = len(errors) + (len(warnings) if strict else 0)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if n_issues > 0 else 0)


if __name__ == "__main__":
    main()
