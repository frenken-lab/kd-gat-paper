# TMLR Beyond PDF Conversion

Converts MyST paper to TMLR Beyond PDF submission format by serializing the MyST AST.

## Usage

```bash
make tmlr          # Build submission
make tmlr-anon     # Build anonymous submission
```

## How It Works

1. Runs `myst build --site` to produce AST JSON in `_build/site/content/`
2. Reads each page's AST from `config.json` TOC order
3. Walks the MDAST tree and serializes to Distill-compatible markdown:
   - `cite`/`citeGroup` → `[@key]` / `[@k1; @k2]`
   - `inlineMath`/`math` → `$...$` / `$$...$$`
   - `iframe` → `<iframe src="assets/html/submission/...">` in `<figure>`
   - `container` (table) → bold caption + pipe table (via `tabulate`)
   - `crossReference` → resolved text (`Table 1`, `Figure 2`)
   - `admonition` → blockquote
4. Builds TOC from `##`/`###` headers
5. Reads abstract/authors/title from AST frontmatter (not source files)
6. Generates TMLR frontmatter (`layout: distill`, `htmlwidgets: true`)
7. Copies assets: `figures/*.html` → `assets/html/submission/`, `references/*.bib` (concatenated) → `assets/bibliography/submission.bib`

## Output Structure

```
submission_folder/
├── submission.md
└── assets/
    ├── img/submission/
    ├── gif/submission/
    ├── html/submission/    ← interactive figures
    └── bibliography/submission.bib
```

## Dependencies

- Node.js 18+ (for mystmd)
- Python 3.12+ with PyYAML, tabulate
