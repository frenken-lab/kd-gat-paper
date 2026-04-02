# TMLR Export

The TMLR export pipeline converts the MyST paper into a Distill-layout markdown submission compatible with the TMLR Beyond PDF author kit.

## Prerequisites

`myst build --site` must run first. The export reads:
- `_build/site/content/*.json` — MyST AST for each page
- `_build/site/config.json` — project metadata (title, authors, TOC)

## How It Works

```bash
python export/tmlr/build.py --output _build/submission/
python export/tmlr/build.py --output _build/submission_anon/ --anonymous
```

### Pipeline

1. **Read config**: loads `config.json` for project title, authors, and TOC order.
2. **Serialize pages**: iterates TOC entries in order; for each, loads the AST JSON and recursively serializes nodes to Distill-compatible markdown.
3. **Build frontmatter**: YAML block with `layout: distill`, title, description (from abstract AST), and authors. The `--anonymous` flag replaces author names.
4. **Build TOC**: scans serialized markdown for `##` and `###` headings.
5. **Write output**: `submission.md` = frontmatter + TOC + content.
6. **Copy assets**: concatenates all `references/*.bib` → `assets/bibliography/submission.bib`; copies `_build/figures/*.html` → `assets/html/submission/`.

### Key AST Handlers

| Handler | What it does |
|---------|-------------|
| `_h_iframe` | Strips absolute GitHub Pages URL, rebuilds as `assets/html/submission/<filename>` — anonymizes figure sources |
| `_h_details` | MyST `{dropdown}` → HTML5 `<details>/<summary>` |
| `_h_tab_set` | MyST `{tab-set}` → Bootstrap 4 nav-tabs HTML |
| `citeGroup` / `cite` | Emits `<d-cite key="...">` tags for Distill's bibliography |

### iframe Rewriting

This is the critical anonymization step. Content files reference figures with absolute URLs:

```markdown
:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/umap.html
```

The `_h_iframe` handler extracts just the filename and rebuilds it as a relative path:

```html
<iframe src="assets/html/submission/umap.html"></iframe>
```

No external URLs leak into the anonymous submission.

## Output Structure

```
_build/submission/
  submission.md                     # Distill-layout markdown
  assets/
    bibliography/submission.bib     # Concatenated references
    html/submission/*.html          # Self-contained figure files
```

## Integration with Author Kit

The submission is merged into the vendored TMLR author kit:

```bash
cp _build/submission/submission.md tmlr_do_not_modify/_under_review/submission.md
cp -r _build/submission/assets/* tmlr_do_not_modify/assets/
```

The author kit then builds a Jekyll site with Distill's CSS/JS for the final rendered output.

## Local Preview

```bash
make preview    # Builds submission, merges into author kit, runs Jekyll via Docker
```

Requires Docker for the Jekyll preview.
