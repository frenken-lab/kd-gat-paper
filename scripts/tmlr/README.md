# TMLR Beyond PDF Conversion

Converts MyST sources to TMLR Beyond PDF submission format using `myst build --md`.

## Usage

```bash
make tmlr          # Build submission
make tmlr-anon     # Build anonymous submission
```

## What It Does

1. Reads TOC from `myst.yml` to get file order
2. Exports each file with `npx mystmd build <file> --md --force`
3. Concatenates exported markdown
4. Post-processes MyST syntax to standard markdown:
   - `{math}\`...\`` → `$...$`
   - `` ```{math} `` blocks → `$$...$$`
   - `:::` directives → removed (content kept)
   - `+++` → `---`
5. Adds TMLR frontmatter (`layout: distill`)
6. Copies assets to submission folder

## Output Structure

```
submission_folder/
├── submission.md
└── assets/
    ├── img/submission/
    ├── gif/submission/
    ├── html/submission/
    └── bibliography/submission.bib
```

## Dependencies

- Node.js 18+ (for mystmd via npx)
- Python 3.12+ with PyYAML
