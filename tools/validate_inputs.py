#!/usr/bin/env python3
"""Validate paper inputs against `data/schemas.yaml` and bibliography rules.

Usage:
    python tools/validate_inputs.py
    python tools/validate_inputs.py --data-only
    python tools/validate_inputs.py --bib-only
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import bibtexparser
import yaml

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"
BIB_DIR = ROOT / "paper" / "references"
BIB_PATHS = sorted(BIB_DIR.glob("*.bib"))

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


def load_schemas() -> dict:
    with open(SCHEMA_PATH) as f:
        return yaml.safe_load(f)


def validate_csv(name: str, spec: dict) -> list[str]:
    path = ROOT / "data" / "csv" / name
    if not path.exists():
        return [f"CSV {name}: file not found"]
    errors = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        for col in spec["columns"]:
            if col not in headers:
                errors.append(f"CSV {name}: missing column '{col}'")
        rows = list(reader)
        if len(rows) < spec.get("min_rows", 1):
            errors.append(f"CSV {name}: {len(rows)} rows < min {spec['min_rows']}")
    return errors


def validate_json(name: str, spec: dict, schemas: dict) -> list[str]:
    file_map = schemas.get("file_map", {})
    rel = file_map.get(
        f"figures/{name}/data.json", f"interactive/src/figures/data/{name}/data.json"
    )
    path = ROOT / rel
    if not path.exists():
        return [f"JSON {name}: file not found at {rel}"]
    errors = []
    with open(path) as f:
        data = json.load(f)
    dtype = spec.get("type", "object")
    if dtype == "array":
        if not isinstance(data, list):
            return [f"JSON {name}: expected array, got {type(data).__name__}"]
        if len(data) < spec.get("min_items", 1):
            errors.append(f"JSON {name}: {len(data)} items < min {spec['min_items']}")
        if "item_keys" in spec and data:
            missing = [k for k in spec["item_keys"] if k not in data[0]]
            if missing:
                errors.append(f"JSON {name}: items missing keys {missing}")
    elif dtype == "object":
        if not isinstance(data, dict):
            return [f"JSON {name}: expected object, got {type(data).__name__}"]
        for k in spec.get("required_keys", []):
            if k not in data:
                errors.append(f"JSON {name}: missing key '{k}'")
    return errors


def validate_data(schemas: dict | None = None) -> list[str]:
    if schemas is None:
        schemas = load_schemas()

    errors: list[str] = []
    for name, spec in schemas.get("csv", {}).items():
        errors.extend(validate_csv(name, spec))
    for name, spec in schemas.get("json", {}).items():
        errors.extend(validate_json(name, spec, schemas))
    return errors


def validate_bib(*, strict: bool = False) -> tuple[list[str], list[str]]:
    library = bibtexparser.Library()
    for bib_path in BIB_PATHS:
        lib = bibtexparser.parse_file(bib_path)
        for entry in lib.entries:
            library.add(entry)
        if lib.failed_blocks:
            for block in lib.failed_blocks:
                library.add(block)

    warnings: list[str] = []
    errors: list[str] = []

    seen_keys: set[str] = set()
    for entry in library.entries:
        if entry.key in seen_keys:
            errors.append(f"Duplicate key: {entry.key}")
        seen_keys.add(entry.key)

    for entry in library.entries:
        entry_type = entry.entry_type.lower()
        fields = entry.fields_dict
        required = REQUIRED_FIELDS.get(entry_type, ["title"])
        for field_name in required:
            field = fields.get(field_name)
            if field is None or not field.value.strip():
                errors.append(f"[{entry.key}] missing required field: {field_name}")

        if entry_type in ("article", "inproceedings") and "doi" not in fields:
            warnings.append(f"[{entry.key}] no DOI")

        if "doi" not in fields and "url" not in fields and entry_type in ("misc", "online"):
            warnings.append(f"[{entry.key}] no DOI or URL")

    if strict and warnings:
        errors.extend(f"WARNING: {w}" for w in warnings)
        warnings = []

    return errors, warnings


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-only", action="store_true", help="Validate data files only")
    parser.add_argument("--bib-only", action="store_true", help="Validate bibliography only")
    parser.add_argument("--strict", action="store_true", help="Treat bib warnings as errors")
    args = parser.parse_args()

    if not args.bib_only:
        schemas = load_schemas()
        errors = validate_data(schemas)
        if errors:
            for e in errors:
                print(f"  FAIL: {e}", file=sys.stderr)
            sys.exit(1)
        print(f"  OK: {len(schemas.get('csv', {}))} CSV, {len(schemas.get('json', {}))} JSON validated")

    if not args.data_only:
        errors, warnings = validate_bib(strict=args.strict)
        for w in warnings:
            print(f"WARN: {w}")
        for e in errors:
            print(f"ERROR: {e}")
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
        if errors or (warnings and args.strict):
            sys.exit(1)


if __name__ == "__main__":
    main()

