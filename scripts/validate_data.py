#!/usr/bin/env python3
"""Validate committed data files against data/schemas.yaml."""

import csv
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"


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


def validate_json(name: str, spec: dict) -> list[str]:
    file_map = schemas.get("file_map", {})
    rel = file_map.get(f"figures/{name}/data.json", f"interactive/src/{name}/data.json")
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


if __name__ == "__main__":
    if not SCHEMA_PATH.exists():
        print(f"Schema file not found: {SCHEMA_PATH}")
        sys.exit(1)

    with open(SCHEMA_PATH) as f:
        schemas = yaml.safe_load(f)

    errors: list[str] = []

    for name, spec in schemas.get("csv", {}).items():
        errors.extend(validate_csv(name, spec))

    for name, spec in schemas.get("json", {}).items():
        errors.extend(validate_json(name, spec))

    if errors:
        for e in errors:
            print(f"  FAIL: {e}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"  OK: {len(schemas.get('csv', {}))} CSV, {len(schemas.get('json', {}))} JSON validated")
