# TMLR Beyond PDF Conversion Requirements

Target: [TMLR Beyond PDF](https://tmlr-beyond-pdf.org/submission-instructions)

## Output Structure

```
submission_folder/
├── submission.md                    # Single concatenated markdown file
├── assets/
│   ├── img/submission/              # Static figures (UMAP plots, architecture diagrams)
│   ├── gif/submission/              # Video content as GIFs (empty for us)
│   ├── html/submission/             # Interactive HTML figures with JS (optional)
│   └── bibliography/submission.bib  # Copy of references.bib
```

Do NOT modify anything in `tmlr_do_not_modify/` (ships with author kit).

## Converter Script Tasks (`scripts/convert_tmlr.py`)

### 1. Concatenate files
- Read `myst.yml` TOC order
- Concatenate `index.md` + `content/*.md` + `appendix/*.md` into single `submission.md`
- Strip per-file YAML frontmatter (`---\ntitle: ...\n---`)
- Keep section headers (##, ###) as-is

### 2. Generate TMLR frontmatter
Pull from `myst.yml` and `index.md`:
```yaml
---
layout: distill
title: "<from myst.yml project.title>"
description: "<from index.md abstract>"
htmlwidgets: true
authors:
  - Anonymous    # During review; real names post-acceptance
bibliography: submission.bib
toc:
  - name: Introduction
  - name: Background
  # ... match actual ## headers
---
```

### 3. Convert MyST directives → plain markdown

| MyST syntax | TMLR output |
|-------------|-------------|
| `` ```{math}\n:label: eq-foo\n...\n``` `` | `$$ ... $$` |
| `:::{table} Caption\n:label: tbl-foo\n...\n:::` | Plain markdown table with caption as bold text above |
| `:::{admonition} Title\n:class: note\n...\n:::` | `> **Title**\n> ...` (blockquote) |
| `` ```{code-cell} python\n...\n``` `` | Pre-rendered markdown table from CSV (see step 5) |

### 4. Convert cross-references
| MyST syntax | TMLR output |
|-------------|-------------|
| `[](#eq-foo)` | `Equation N` (numbered by order of appearance) |
| `[](#tbl-foo)` | `Table N` (numbered by order of appearance) |
| `[](#sec-foo)` | `Section N` or section title |
| `[](#alg-foo)` | `Algorithm N` |

Build a label→number map by scanning all labels in document order.

### 5. Render code cells as static tables
- `{code-cell}` blocks load CSVs via pandas → `Markdown(df.to_markdown())`
- Converter reads the CSV directly and renders as a markdown table
- Prepend table caption from `:caption:` metadata as `**Table N:** Caption`
- Requires `data/*.csv` to exist at conversion time

### 6. Copy assets
- `figures/*` → `assets/img/submission/`
- `references.bib` → `assets/bibliography/submission.bib`
- Update image paths in markdown: `figures/foo.png` → `assets/img/submission/foo.png`

### 7. Post-processing
- Verify no MyST directives remain (scan for ```` ``` { ```` and `:::`)
- Verify all `$$ ... $$` math blocks are valid LaTeX
- Verify no broken cross-references (`[](#...)` with no resolution)

## Build & Verify

1. Download TMLR Author Kit from [submission instructions](https://tmlr-beyond-pdf.org/submission-instructions)
2. Copy `submission_folder/` output into author kit
3. Run `python compile_submission.py` (requires Docker/Podman)
4. Preview at `http://0.0.0.0:8080/tmlr-beyond-pdf/under_review/submission/`
5. Generate browser PDF for archival upload to OpenReview

## Submission Checklist

- [ ] Select "Beyond PDF submission" on OpenReview
- [ ] Authors set to "Anonymous" during review
- [ ] Upload zipped `submission_folder/`
- [ ] Upload browser-generated PDF
- [ ] Verify all equations render correctly
- [ ] Verify all tables have data (CSVs must be populated)
- [ ] Verify interactive HTML figures work (if any)

## Notes

- TMLR Beyond PDF is Distill.pub-inspired, NOT MyST — no directive syntax
- Citations use standard `[@key]` — same as MyST, no conversion needed
- Docker required for local build (`compile_submission.py`); Podman works on OSC (`docker` aliased to podman)
- Interactive figures go in `assets/html/submission/` as self-contained HTML+JS
