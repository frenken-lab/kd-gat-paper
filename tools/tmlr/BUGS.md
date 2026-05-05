# TMLR Build — Table & Equation Failures

Investigation of why tables and equations "fall apart" in the TMLR submission output. All bugs live in `tools/tmlr/build.mjs` (the AST → Distill markdown serializer); the upstream TMLR/Distill kit is not at fault and supports everything we need.

Code-path audit only — `_build/` was empty at investigation time, so this is reasoning from source + handler code, not from a real broken build artifact. Re-run `make tmlr` after fixes to confirm.

## Affected source

- ~10 `:::{table}` blocks across `paper/content/{results,related-work,ablation}.md` and `paper/candidacy/{introduction,proposed-research,broader-impact}.md`
- 20+ `` ```{math} `` blocks with `:label: eq-*` across `paper/content/{background,methodology,explainability}.md`
- `\begin{aligned}` blocks in `paper/candidacy/{appendix,proposed-research}.md`

---

## Bugs

### B1 — Tables lose `<figure>` wrapper, `id` anchor, and number

**Where**: `tools/tmlr/build.mjs:186-208`, `container[table]` handler.

**What it does today**:
```js
return (cap ? `\n**${cap}**\n` : '') + body;
```

**What's missing** (compare to `container[figure]` at lines 181-185, which correctly wraps in `<figure id="...">...</figure>`):
- No `<figure id="tbl-...">` wrapper → no anchor for cross-references
- No `<figcaption>` → caption renders as floating bold paragraph
- No `Table N:` enumerator prefix

**User-visible symptom**: `[](#tbl-main-results)` cross-references render as text "Table 1" (via the `crossReference` handler's template/enumerator path) but the link target doesn't exist → dead text. Tables visually float.

---

### B2 — Equation labels and numbering are dropped

**Where**: `tools/tmlr/build.mjs:68`.

```js
const math = (node) => `\n$$\n${node.value || ''}\n$$\n`;
```

The AST `math` node carries `identifier`, `enumerator`, `label`, and `value`. Only `value` is used.

**Symptom**: 20+ equations with `:label: eq-*` produce unnumbered, unanchored `$$...$$` blocks. `[](#eq-message-passing)` cross-refs in body prose render as text "Eq. (3)" with no link target and no visible "(3)" next to the equation itself. Reader sees an equation, then prose says "as in Eq. (3)" with nothing to map to.

---

### B3 — `crossReference` produces text only, not a hyperlink

**Where**: `tools/tmlr/build.mjs:49-54`.

```js
const crossReference = (node) => {
  const { template, enumerator } = node;
  if (template && enumerator != null) return template.replace('%s', String(enumerator));
  ...
};
```

Returns "Figure 3" / "Table 2" / "Eq. (5)" as plain text. Even when targets *do* have anchors (figures, after B1 fix), refs aren't clickable.

---

### B4 — Table captions strip inline formatting and citations

**Where**: `tools/tmlr/build.mjs:191`.

```js
cap = textOf(c).trim();
```

`textOf` (lines 30-33) only walks `text` value nodes. Captions containing `<d-cite>`, `*emphasis*`, `**strong**`, links, or any inline node lose all of it.

**Symptom**: rich captions in `paper/candidacy/proposed-research.md:18,44,94,...` flatten to plain text. Existing test `cite survives inside table cell` (line 73) covers cells but **not captions** — green tests with broken captions.

---

### B5 — Pipe-table mode silently bypasses HTML fallback

**Where**: `tools/tmlr/build.mjs:204`.

```js
if (content.startsWith('<table')) body = `\n${content}\n`;
```

Only fires for tables built with `format_mode: html` in `tools/tables/spec.yaml`. `test_scenarios` and `vgae_threshold` (no `format_mode: html`) fall through to AST → pipe-table rendering. Different visual style on the same page from `main_results`. Not strictly wrong, but inconsistent and hard to debug.

---

### Non-bugs (confirmed safe via Distill template)

- `\begin{aligned}` inside `$$...$$` — MathJax handles this fine, no number expected (use `align` if numbering wanted; see B2 fix below).
- Algorithm admonitions (`build.mjs:149-167`) — inline CSS approach is OK; tested.
- Iframe path rewriting — already covered by tests.

---

## Distill / TMLR template capability research

Confirmed by reading `tmlr_do_not_modify/`:

| Feature | Where defined | Verdict |
|---|---|---|
| MathJax with AMS tags | `_includes/scripts/mathjax.html:6` (`tags: 'ams'`) | **Supported.** Numbered environments (`equation`, `align`, `gather`) auto-number. `\label{eq:foo}` inside the env creates a target. `\eqref{eq:foo}` in body prose renders the linked "(N)". |
| `<figure id="...">` + `<figcaption>` | `assets/js/distillpub/template.v2.js` defines `d-article table`, `d-article figure`, `<d-figure>` web component | **Supported.** Standard HTML5 `<figure>` works; `<figcaption>` is styled by Distill CSS. No auto-numbering for figures/tables — caller manages "Figure N" / "Table N" prefixes. |
| Markdown inside `<figure>` HTML | Jekyll = kramdown, `_config.yml:76-79` (input: GFM) | **Supported with `markdown="1"`.** Kramdown processes Markdown inside an HTML block when `markdown="1"` attribute is set on the wrapper. Already used in our `details` handler (build.mjs:111). |
| Pipe tables (GFM) | kramdown `input: GFM` | **Supported.** Standard pipe tables render as `<table>` automatically. |
| `<d-cite>` citations | distillpub web components | **Supported.** Already handled. |
| HTML anchors `<a id="...">` | kramdown / browser default | **Supported.** Plain HTML anchor — works as cross-ref target if AMS labeling isn't desired. |
| `\eqref{}` cross-refs | MathJax tags='ams' | **Supported.** Renders as "(N)" linked to the labeled equation. Preferred path for equation refs. |

**Bottom line**: every fix below is implementable inside the TMLR kit constraints. The kit isn't restricting us; the serializer just doesn't emit the right shapes.

---

## Proposed fixes

### F1 — Wrap tables in `<figure id="..."><figcaption>...</figcaption>...</figure>`

Replace the `container[table]` handler body:

```js
if (kind === 'table') {
  let cap = '';
  let body = '';
  for (const c of children) {
    if (c.type === 'caption') {
      cap = state.containerPhrasing(c, info).trim();   // F4: preserve cite/em
    } else {
      body += serializeChild(c, state, info);
    }
  }
  const label = node.identifier || '';
  if (label.startsWith('tbl-')) {
    const tableName = label.slice(4).replaceAll('-', '_');
    const htmlPath = join(TABLE_DIR, `${tableName}.md`);
    if (existsSync(htmlPath)) {
      const content = readFileSync(htmlPath, 'utf8').trim();
      if (content.startsWith('<table')) body = `\n${content}\n`;
    }
  }
  const idAttr = node.identifier ? ` id="${node.identifier}"` : '';
  const num = node.enumerator ? `<strong>Table ${node.enumerator}:</strong> ` : '';
  const figcap = cap ? `<figcaption>${num}${cap}</figcaption>\n` : '';
  return `\n<figure${idAttr} markdown="1">\n${figcap}\n${body}\n</figure>\n`;
}
```

`markdown="1"` lets kramdown process the included pipe table inside the `<figure>` block. Tested pattern — the `details` handler already does this.

### F2 — Emit equation anchor + AMS numbering

Replace the `math` handler:

```js
const math = (node) => {
  const value = node.value || '';
  const isNumberedEnv = /\\begin\{(equation|align|gather|multline)\*?\}/.test(value);
  const id = node.identifier ? `<a id="${node.identifier}"></a>\n` : '';
  if (isNumberedEnv || !node.identifier) {
    return `\n${id}$$\n${value}\n$$\n`;
  }
  return `\n${id}$$\n\\begin{equation}\\label{${node.identifier}}\n${value}\n\\end{equation}\n$$\n`;
};
```

Trade-off: this auto-wraps in `equation` only when the author *didn't* and a label exists. If you'd rather not wrap and instead rely on a manual visible "(N)" tag, switch to `\tag{${node.enumerator}}` injection. Either way, the `<a id>` anchor handles in-page hash-link refs.

### F3 — `crossReference` should emit hyperlinks

Replace the `crossReference` handler:

```js
const crossReference = (node, _parent, state, info) => {
  const { template, enumerator, identifier } = node;
  const inner =
    template && enumerator != null
      ? template.replace('%s', String(enumerator))
      : node.children?.length
        ? state.containerPhrasing(node, info)
        : `[${identifier || ''}]`;
  if (identifier?.startsWith('eq-')) return `\\eqref{${identifier}}`;
  return identifier ? `[${inner}](#${identifier})` : inner;
};
```

For equations the cleaner output is `\eqref{eq-foo}` which MathJax renders as a linked "(3)". For figures/tables, a normal `[Figure 3](#fig-foo)` markdown link.

### F4 — Caption phrasing (already folded into F1)

Use `state.containerPhrasing(captionNode)` instead of `textOf` so `<d-cite>`, emphasis, links survive.

### F5 — Asymmetric table modes (cosmetic)

Either:
- Add `format_mode: html` to all entries in `tools/tables/spec.yaml` (uniform HTML output), or
- Drop the HTML branch in `build.py` entirely and rely on the kramdown pipe-table → `<table>` path with a single CSS rule for the bolded user-models row.

Lower priority than B1–B4. Defer until B1–B4 land and the visual delta is real.

---

## Tests to add (would fail today, pass after fixes)

```js
test('container[table] wraps in <figure id="tbl-..."> with figcaption', () => {
  const out = serialize(root(tableContainer('tbl-foo',
    caption(text('My caption')),
    tableNode(tableRow(tableCell(text('A'))), tableRow(tableCell(text('1'))))
  )));
  expect(out).toMatch(/<figure id="tbl-foo" markdown="1">/);
  expect(out).toMatch(/<figcaption>.*My caption<\/figcaption>/);
});

test('table caption preserves inline cite', () => {
  const out = serialize(root(tableContainer('tbl-x',
    caption(text('See '), cite('ref1')),
    tableNode(tableRow(tableCell(text('A'))))
  )));
  expect(out).toMatch(/<d-cite key="ref1">/);
});

test('math node with identifier emits <a id> anchor', () => {
  const out = serialize(root({ type: 'math', value: 'x = y', identifier: 'eq-foo' }));
  expect(out).toMatch(/<a id="eq-foo">/);
});

test('crossReference to equation uses \\eqref', () => {
  const out = serialize(root(paragraph(xref({
    identifier: 'eq-foo', template: 'Eq. (%s)', enumerator: 3,
  }))));
  expect(out).toMatch(/\\eqref\{eq-foo\}/);
});

test('crossReference to figure emits markdown link', () => {
  const out = serialize(root(paragraph(xref({
    identifier: 'fig-bar', template: 'Figure %s', enumerator: 2,
  }))));
  expect(out).toMatch(/\[Figure 2\]\(#fig-bar\)/);
});
```

---

## Verification path (without bun on this host)

1. On a machine with `bun` + `mystmd` installed (laptop/WSL): `make tmlr` (current state) — capture `_build/submission/submission.md`. This is the broken baseline.
2. Apply F1–F4. Re-run `make tmlr`. Diff the two `submission.md` files.
3. `cd tools/tmlr && bun test` — existing 29 tests + 5 new ones should all pass.
4. `make preview` — Jekyll renders the submission locally in Docker. Visually inspect: equations numbered, refs clickable, tables wrapped in figure boxes with captions.
