# Candidacy Build

The candidacy build is a superset of the paper, adding extended sections for the PhD candidacy report. It uses the same source files but a separate config (`myst.candidacy.yml`).

## Paper vs Candidacy

| Aspect | Paper (`myst.yml`) | Candidacy (`myst.candidacy.yml`) |
|--------|-------------------|----------------------------------|
| Entry point | `paper/index.md` | `paper/candidacy/index.md` |
| Scope | Core framework | Framework + proposed extensions |
| Extra sections | — | Introduction (extended), CWD background, proposed research, broader impact, physics appendix |
| TOC structure | ~11 individual pages | 4 combined pages (via `{include}`) |
| Web deploy | GitHub Pages (Distill) | curve.space (MyST SPA) |
| PDF export | — | Typst book (`plain_typst_book`) |
| Bibliography | 11 .bib files | 13 .bib files (+ candidacy.bib) |

## Combined Pages

The candidacy TOC consolidates sections into continuous pages using `{include}` directives:

| Combined Page | Source Files Included |
|--------------|----------------------|
| **Current Framework** | introduction, background, candidacy-background, related-work, methodology, experiments, results, ablation, explainability |
| **Proposed Research** | proposed-research, broader-impact |
| **Conclusion** | conclusion (standalone) |
| **Appendix** | architecture, figures, physics-appendix |

The combined wrapper files live in `paper/candidacy/` (e.g., `paper/candidacy/current-framework.md`). They skip frontmatter from included files using `:start-line: 3` and let the existing `##` headings serve as section dividers.

Original source files are unchanged — the paper build continues to use them individually.

## PDF Export

The candidacy PDF uses MyST's Typst export with the `plain_typst_book` template:

```bash
make candidacy-pdf    # → _build/exports/candidacy-report.pdf
```

Config in `myst.candidacy.yml`:
```yaml
exports:
  - format: typst
    template: plain_typst_book
    output: _build/exports/candidacy-report.pdf
    articles: [...]     # Individual source files (not combined pages)
    options:
      show_pagenumber: true
      show_ToC: true
      ToC_depth: 3
      papersize: us-letter
```

The PDF `articles` list uses individual source files (not the combined `{include}` wrappers) for cleaner chapter structure in the PDF.

## Known Typst Limitations

The MyST-to-Typst converter has gaps with some LaTeX symbols and directives:
- `{details}` (dropdown) nodes are silently skipped
- Custom admonition types (e.g., `algorithm`) don't get Typst labels
- Some LaTeX symbols need workarounds (e.g., `\bigoplus` → `\oplus`)

## Development

```bash
make candidacy-dev    # Live-reload at localhost:3000
make candidacy-site   # Full build (web)
make candidacy-pdf    # PDF export
```

## Adding Candidacy-Only Content

1. Create the file in `candidacy/` (not `content/` — that's shared).
2. Add it to the relevant combined wrapper file via `{include}`.
3. Add it to the PDF `articles` list in `myst.candidacy.yml`.
4. Add the .bib file to `bibliography` if new references are needed.
