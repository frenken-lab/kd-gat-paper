#!/usr/bin/env python3
"""Pull paper data from ESS and validate against data/schemas.json.

Usage:
    python scripts/pull_data.py                    # Pull from ESS + validate
    python scripts/pull_data.py --from-repo        # Validate committed data only (CI)
    python scripts/pull_data.py --ess-root /path   # Override ESS root
"""

from __future__ import annotations

import csv
import hashlib
import json
import logging
import os
import shutil
import sys
from pathlib import Path

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

ROOT = Path(__file__).resolve().parent.parent
SCHEMAS = json.loads((ROOT / "data" / "schemas.json").read_text())


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def pull(ess_root: Path) -> list[str]:
    """Copy files from ESS to repo per file_map. Returns errors."""
    paper_dir = ess_root / "exports" / "paper"
    if not paper_dir.exists():
        return [f"ESS paper dir not found: {paper_dir}"]

    errors, copied = [], 0
    for ess_rel, repo_rel in SCHEMAS["file_map"].items():
        src, dst = paper_dir / ess_rel, ROOT / repo_rel
        if not src.exists():
            errors.append(f"Missing on ESS: {src}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1

    # Verify manifest checksums
    manifest_path = paper_dir / "_manifest.json"
    if manifest_path.exists():
        for entry in json.loads(manifest_path.read_text()).get("artifacts", []):
            src = paper_dir / entry["name"]
            if src.exists() and _sha256(src) != entry["sha256"]:
                errors.append(f"Checksum mismatch: {entry['name']}")
    else:
        errors.append("No _manifest.json — checksums not verified")

    log.info("Copied %d files from ESS", copied)
    return errors


def validate() -> list[str]:
    """Validate committed data against schemas.json."""
    errors = []

    # CSVs
    for name, schema in SCHEMAS["csv"].items():
        path = ROOT / "data" / "csv" / name
        if not path.exists():
            errors.append(f"Missing: {path.relative_to(ROOT)}")
            continue
        with open(path) as f:
            rows = list(csv.DictReader(f))
        if not rows:
            errors.append(f"{name}: empty")
            continue
        for col in schema["columns"]:
            if col not in rows[0]:
                errors.append(f"{name}: missing column '{col}'")
        if len(rows) < schema.get("min_rows", 0):
            errors.append(f"{name}: {len(rows)} rows < {schema['min_rows']}")

    # JSONs
    for name, schema in SCHEMAS["json"].items():
        path = ROOT / "interactive" / "src" / name / "data.json"
        if not path.exists():
            errors.append(f"Missing: {path.relative_to(ROOT)}")
            continue
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            errors.append(f"{name}: invalid JSON — {e}")
            continue

        if schema["type"] == "array":
            if not isinstance(data, list):
                errors.append(f"{name}: expected array")
            elif len(data) < schema.get("min_items", 0):
                errors.append(f"{name}: {len(data)} items < {schema['min_items']}")
            elif data and any(k not in data[0] for k in schema.get("item_keys", [])):
                missing = [k for k in schema["item_keys"] if k not in data[0]]
                errors.append(f"{name}: missing keys {missing}")
        elif schema["type"] == "object":
            if not isinstance(data, dict):
                errors.append(f"{name}: expected object")
            else:
                missing = [k for k in schema.get("required_keys", []) if k not in data]
                if missing:
                    errors.append(f"{name}: missing keys {missing}")

    return errors


def main() -> None:
    import argparse

    p = argparse.ArgumentParser(description="Pull and validate paper data")
    p.add_argument("--from-repo", action="store_true", help="Validate only (no ESS)")
    p.add_argument("--ess-root", type=Path, default=None)
    args = p.parse_args()

    errors = []
    if not args.from_repo:
        ess = args.ess_root or os.environ.get("KD_GAT_LAKE_ROOT")
        if not ess:
            log.error("KD_GAT_LAKE_ROOT not set and --ess-root not provided")
            sys.exit(1)
        errors.extend(pull(Path(ess)))

    errors.extend(validate())

    if errors:
        log.error("%d error(s):", len(errors))
        for e in errors:
            log.error("  - %s", e)
        sys.exit(1)
    log.info("All validations passed")


if __name__ == "__main__":
    main()
