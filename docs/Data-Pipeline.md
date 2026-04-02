# Data Pipeline

Data flows from the [KD-GAT](https://github.com/frenken-lab/KD-GAT) evaluation artifacts through a validated export/pull pipeline into the paper.

## Flow

```
KD-GAT eval artifacts
  → export_paper_data.py (in KD-GAT)
  → ESS exports/paper/ (_manifest.json + _provenance.json)
  → pull_data.py (this repo, validates schemas.yaml)
  → data/csv/ + interactive/src/figures/*/data.json
  → make figures → _build/figures/*.html
  → make tables → _build/tables/*.md
  → myst build → paper site
```

## Schema Validation

`data/schemas.yaml` is the **single source of truth** for all data contracts. Both the KD-GAT exporter and this repo's pull script read from it. Don't hardcode schemas elsewhere.

### CSV Validation

For each declared CSV, `data/validate.py` checks:
- File exists at `data/csv/<name>`
- All declared `columns` are present in CSV headers
- Row count meets `min_rows` constraint

### JSON Validation (Figure Data)

For each declared JSON file:
- Resolves path via `schemas.file_map` (e.g., `figures/umap/data.json` → `interactive/src/figures/umap/data.json`)
- **Array type**: checks it's a list, validates `min_items`, checks `item_keys` in first item
- **Object type**: checks it's a dict, validates `required_keys`

## Commands

| Command | What it does |
|---------|-------------|
| `make data` | Pulls from ESS + validates against `schemas.yaml` |
| `make validate` | Validates committed data only (no ESS pull, used in CI) |

## Adding a New Data File

1. Add the schema to `data/schemas.yaml`:
   ```yaml
   my_new_data:
     type: csv
     columns: [col_a, col_b, col_c]
     min_rows: 10
   ```

2. Export from KD-GAT via `export_paper_data.py` (add an export handler there).

3. Run `make data` to pull and validate.

4. If it's figure data, add a `file_map` entry in `schemas.yaml` pointing to the JSON path under `interactive/src/figures/`.
