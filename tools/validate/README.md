# tools/validate

Validators for the paper build, organized by the contract they enforce. The current validation entry point is `tools/validate_inputs.py`.

## Layout

```
tools/validate/
  README.md                       This note
tools/validate_inputs.py          CSV/JSON + BibTeX input contract
```

`make validate` runs the input validator and the GSN walker.

## Running

```bash
make validate                      # all layers
make validate-inputs               # Layer 1 only (Python)
make validate-gsn                  # GSN schema and gap inventory
```

Exit code is non-zero on validation errors.
