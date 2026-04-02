# Table Authoring

Tables are built declaratively from CSV data using specs defined in `data/tables/spec.yaml`.

## How It Works

```
data/csv/*.csv + data/csv/literature_baselines.csv
  → data/tables/spec.yaml (defines columns, formatting, sort order)
  → data/tables/build.py
  → _build/tables/<name>.md (booktabs-style pipe tables)
  → content files include via {include} directive
```

## Spec Format

Each table in `data/tables/spec.yaml` defines:

```yaml
main_results:
  source: csv/results.csv              # Primary data CSV
  baselines_source: csv/literature_baselines.csv  # Literature comparisons
  columns:                              # Ordered column mapping
    model: Model                        # csv_key: Display Header
    accuracy: Accuracy
    precision: Precision
    recall: Recall
    f1: F1
  format:                               # Per-column Python format strings
    accuracy: "{:.4f}"
    precision: "{:.4f}"
    recall: "{:.4f}"
    f1: "{:.4f}"
  sort_order:
    baselines_first: true               # Baselines above separator line
    bold_models: [GAT, VGAE, FUSION]    # These rows are **bolded**
```

## Build

```bash
make tables    # Renders all specs to _build/tables/*.md
```

`build.py` reads each spec entry, loads the CSVs, applies formatting and sorting, then writes a booktabs-style markdown pipe table.

### Output Layout (when `baselines_first: true`)

1. Literature baselines (sorted alphabetically)
2. Blank separator row
3. User models (sorted alphabetically, **bolded** if in `bold_models`)

## Including in Content

In any MyST content file:

````markdown
```{include} ../_build/tables/main_results.md
```
````

Tables are rebuilt by `make tables` before `make site`, so they're always fresh in the site build.

## Adding a New Table

1. Export the CSV from KD-GAT and place in `data/csv/`.
2. Add a schema entry in `data/schemas.yaml`.
3. Add a spec entry in `data/tables/spec.yaml`.
4. Run `make tables` to verify output.
5. Add an `{include}` directive in the relevant content file.

## Literature Baselines

`data/csv/literature_baselines.csv` holds comparison metrics with BibTeX citation keys. The `baselines_source` field in the spec pulls these in alongside the primary results. Citation keys in the `model` column are rendered as-is (the MyST build resolves them).
