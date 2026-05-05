// Semantic-property tests for the TMLR serializer.
//
// Tests check observable Distill features (d-cite tags, math fences,
// iframe paths, algorithm CSS, figure wrappers, table HTML fallback)
// rather than exact byte-for-byte output. Exact output is the
// responsibility of mdast-util-to-markdown; we test only the
// Distill-flavored handlers we own.
//
// Run: cd tools/tmlr && bun test

import { test, expect } from 'bun:test';
import yaml from 'js-yaml';
import { serialize, buildFrontmatter, buildToc, collectTocFiles, textOf } from './build.mjs';

// ---------------------------------------------------------------------------
// AST builders (mirror tests/conftest.py shapes)
// ---------------------------------------------------------------------------
const text = (v) => ({ type: 'text', value: v });
const paragraph = (...c) => ({ type: 'paragraph', children: c });
const root = (...c) => ({ type: 'root', children: c });
const heading = (depth, ...c) => ({ type: 'heading', depth, children: c });
const cite = (id, label) => ({ type: 'cite', identifier: id, ...(label ? { label } : {}) });
const citeGroup = (...c) => ({ type: 'citeGroup', children: c });
const inlineMath = (v) => ({ type: 'inlineMath', value: v });
const blockMath = (v) => ({ type: 'math', value: v });
const iframe = (src) => ({ type: 'iframe', src });
const image = (props) => ({ type: 'image', ...props });
const xref = (props) => ({ type: 'crossReference', ...props });
const link = (url, ...c) => ({ type: 'link', url, children: c });
const figureContainer = (id, ...c) => ({
  type: 'container', kind: 'figure', identifier: id, children: c,
});
const tableContainer = (id, ...c) => ({
  type: 'container', kind: 'table', identifier: id, children: c,
});
const caption = (...c) => ({ type: 'caption', children: c });
const tableNode = (...rows) => ({ type: 'table', children: rows });
const tableRow = (...cells) => ({ type: 'tableRow', children: cells });
const tableCell = (...c) => ({ type: 'tableCell', children: c });
const admonitionTitle = (...c) => ({ type: 'admonitionTitle', children: c });
const admonition = (titleC, bodyC, cls) => ({
  type: 'admonition',
  ...(cls ? { class: cls } : {}),
  children: [admonitionTitle(...titleC), ...bodyC],
});
const tabSet = (...items) => ({ type: 'tabSet', children: items });
const tabItem = (title, ...c) => ({ type: 'tabItem', title, children: c });
const detailsNode = (summaryC, bodyC, open = false) => ({
  type: 'details', ...(open ? { open: true } : {}),
  children: [{ type: 'summary', children: summaryC }, ...bodyC],
});

// ---------------------------------------------------------------------------
// Citations — <d-cite> tags must survive as raw HTML
// ---------------------------------------------------------------------------

test('cite emits <d-cite key="..."> tag with label preferred over identifier', () => {
  const out = serialize(root(paragraph(cite('myref'))));
  expect(out).toMatch(/<d-cite key="myref"><\/d-cite>/);
});

test('cite uses label field when present', () => {
  const out = serialize(root(paragraph(cite('id-a', 'label-a'))));
  expect(out).toMatch(/<d-cite key="label-a"><\/d-cite>/);
  expect(out).not.toMatch(/key="id-a"/);
});

test('citeGroup concatenates children into a run of <d-cite> tags', () => {
  const out = serialize(root(paragraph(citeGroup(cite('a'), cite('b'), cite('c')))));
  expect(out).toMatch(/<d-cite key="a"><\/d-cite><d-cite key="b"><\/d-cite><d-cite key="c"><\/d-cite>/);
});

test('cite survives inside table cell (regression: container[table] dispatch)', () => {
  const tree = root(
    tableContainer('tbl-cited',
      tableNode(
        tableRow(tableCell(text('Header'))),
        tableRow(tableCell(text('Row '), cite('book')))
      )
    )
  );
  const out = serialize(tree);
  expect(out).toMatch(/<d-cite key="book"><\/d-cite>/);
});

// ---------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------

test('inlineMath wraps in single $', () => {
  const out = serialize(root(paragraph(inlineMath('x^2'))));
  expect(out).toMatch(/\$x\^2\$/);
});

test('block math fenced with $$', () => {
  const out = serialize(root(blockMath('y = mx + b')));
  expect(out).toMatch(/\$\$\ny = mx \+ b\n\$\$/);
});

test('block math with identifier emits <a id> anchor and AMS \\label', () => {
  const out = serialize(root({ type: 'math', value: 'x = y', identifier: 'eq-foo' }));
  expect(out).toMatch(/<a id="eq-foo"><\/a>/);
  expect(out).toMatch(/\\begin\{equation\}\\label\{eq-foo\}/);
});

test('block math already in numbered env is not double-wrapped', () => {
  const out = serialize(root({
    type: 'math',
    value: '\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}',
    identifier: 'eq-pair',
  }));
  expect(out).toMatch(/<a id="eq-pair"><\/a>/);
  // Anchor present but no extra \begin{equation} wrapper around \begin{align}.
  expect(out).not.toMatch(/\\begin\{equation\}\\label/);
});

// ---------------------------------------------------------------------------
// Cross-references
// ---------------------------------------------------------------------------

test('crossReference uses template + enumerator when both present', () => {
  const out = serialize(root(paragraph(xref({ identifier: 'fig:x', template: 'Figure %s', enumerator: 3 }))));
  expect(out).toMatch(/Figure 3/);
});

test('crossReference falls back to identifier when no template', () => {
  // Identifier-only refs render as [foo](#foo) so the link target is live.
  const out = serialize(root(paragraph(xref({ identifier: 'foo' }))));
  expect(out).toMatch(/\[foo\]\(#foo\)/);
});

test('crossReference to figure emits clickable markdown link', () => {
  const out = serialize(root(paragraph(xref({
    identifier: 'fig-bar', template: 'Figure %s', enumerator: 2,
  }))));
  expect(out).toMatch(/\[Figure 2\]\(#fig-bar\)/);
});

test('crossReference to equation uses MathJax \\eqref', () => {
  const out = serialize(root(paragraph(xref({
    identifier: 'eq-foo', template: 'Eq. (%s)', enumerator: 3,
  }))));
  expect(out).toMatch(/\\eqref\{eq-foo\}/);
});

// ---------------------------------------------------------------------------
// iframe — Jekyll relative_url + asset path
// ---------------------------------------------------------------------------

test('iframe rewrites src to assets/html/submission/<basename>', () => {
  const out = serialize(root(iframe('https://frenken-lab.github.io/kd-gat-paper/figures/umap.html')));
  expect(out).toMatch(/<iframe src="\{\{ 'assets\/html\/submission\/umap\.html' \| relative_url \}\}"/);
});

test('iframe strips query strings and fragments', () => {
  const out = serialize(root(iframe('umap.html?v=1#anchor')));
  expect(out).toMatch(/'assets\/html\/submission\/umap\.html'/);
  expect(out).not.toMatch(/v=1|#anchor/);
});

// ---------------------------------------------------------------------------
// Image — PDF embed branch + Jekyll path
// ---------------------------------------------------------------------------

test('image uses Jekyll relative_url and assets/images path', () => {
  const out = serialize(root(image({ url: 'figs/architecture.png', alt: 'arch' })));
  expect(out).toMatch(/'assets\/images\/architecture\.png'/);
  expect(out).toMatch(/alt="arch"/);
});

test('image with .pdf extension renders as <embed>', () => {
  const out = serialize(root(image({ url: 'figs/diagram.pdf' })));
  expect(out).toMatch(/<embed src="\{\{ 'assets\/images\/diagram\.pdf' \| relative_url \}\}"/);
  expect(out).toMatch(/type="application\/pdf"/);
});

// ---------------------------------------------------------------------------
// Algorithm admonition — inline CSS
// ---------------------------------------------------------------------------

test('admonition with class="algorithm" emits algorithm-styled div', () => {
  const out = serialize(root(admonition([text('Algorithm 1')], [paragraph(text('body'))], 'algorithm')));
  expect(out).toMatch(/<div class="algorithm"/);
  expect(out).toMatch(/<style>\.algorithm/);
  expect(out).toMatch(/Algorithm 1/);
});

test('plain admonition degrades to blockquote', () => {
  const out = serialize(root(admonition([text('Note')], [paragraph(text('hello'))], '')));
  expect(out).toMatch(/^>\s*\*\*Note\*\*/m);
  expect(out).toMatch(/^>\s*hello/m);
});

// ---------------------------------------------------------------------------
// Container — figure wrapper + table fallback identifier handling
// ---------------------------------------------------------------------------

test('container[figure] wraps children in <figure id="..."> tags', () => {
  const out = serialize(root(figureContainer('fig:foo', iframe('foo.html'), caption(text('cap')))));
  expect(out).toMatch(/<figure id="fig:foo">/);
  expect(out).toMatch(/<\/figure>/);
});

test('container[table] wraps in <figure id="tbl-..."> with figcaption', () => {
  const out = serialize(root(
    tableContainer('tbl-foo',
      caption(text('My caption')),
      tableNode(tableRow(tableCell(text('A'))), tableRow(tableCell(text('1'))))
    )
  ));
  expect(out).toMatch(/<figure id="tbl-foo" markdown="1">/);
  expect(out).toMatch(/<figcaption>.*My caption<\/figcaption>/);
  // Pipe table from gfm-table extension still appears inside the figure.
  expect(out).toMatch(/\| A\s*\|/);
});

test('container[table] enumerator becomes "Table N:" prefix in figcaption', () => {
  const tree = root({
    type: 'container', kind: 'table', identifier: 'tbl-x', enumerator: 4,
    children: [caption(text('Cap')), tableNode(tableRow(tableCell(text('A'))))],
  });
  const out = serialize(tree);
  expect(out).toMatch(/<strong>Table 4:<\/strong>\s*Cap/);
});

test('table caption preserves inline cite (regression: phrasing not textOf)', () => {
  const out = serialize(root(
    tableContainer('tbl-cited-cap',
      caption(text('See '), cite('ref1')),
      tableNode(tableRow(tableCell(text('A'))))
    )
  ));
  expect(out).toMatch(/<d-cite key="ref1">/);
});

// ---------------------------------------------------------------------------
// Tabs and details
// ---------------------------------------------------------------------------

test('tabSet renders each tab as a bold-titled section (Distill nav-tabs are blocked)', () => {
  const out = serialize(root(tabSet(
    tabItem('First', paragraph(text('one'))),
    tabItem('Second', paragraph(text('two')))
  )));
  expect(out).toMatch(/\*\*First\*\*/);
  expect(out).toMatch(/\*\*Second\*\*/);
});

test('details emits <details markdown="1"> with summary and body', () => {
  const out = serialize(root(detailsNode([text('Click')], [paragraph(text('hidden'))], true)));
  expect(out).toMatch(/<details open markdown="1">/);
  expect(out).toMatch(/<summary>Click<\/summary>/);
  expect(out).toMatch(/hidden/);
});

// ---------------------------------------------------------------------------
// Internal link rewriting
// ---------------------------------------------------------------------------

test('internal /foo links rewrite to in-page #foo anchors', () => {
  const out = serialize(root(paragraph(link('/methodology', text('see method')))));
  expect(out).toMatch(/\[see method\]\(#methodology\)/);
});

test('external links pass through unchanged', () => {
  const out = serialize(root(paragraph(link('https://example.com', text('ex')))));
  expect(out).toMatch(/\[ex\]\(https:\/\/example\.com\)/);
});

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

test('frontmatter sets distill layout', async () => {
  const fm = await buildFrontmatter({}, false);
  expect(yaml.load(fm).layout).toBe('distill');
});

test('frontmatter title comes from project', async () => {
  const fm = await buildFrontmatter({ title: 'My Paper' }, false);
  expect(yaml.load(fm).title).toBe('My Paper');
});

test('anonymous mode replaces all authors with single Anonymous', async () => {
  const proj = { authors: [{ name: 'Alice', affiliations: ['MIT'] }] };
  const fm = await buildFrontmatter(proj, true);
  const parsed = yaml.load(fm);
  expect(parsed.authors.length).toBe(1);
  expect(parsed.authors[0].name).toBe('Anonymous');
});

test('non-anonymous preserves authors, normalizes affiliation shape', async () => {
  const proj = {
    authors: [
      { name: 'Alice', affiliations: ['MIT'] },
      { name: 'Bob', affiliations: [{ name: 'Stanford' }] },
    ],
  };
  const parsed = yaml.load(await buildFrontmatter(proj, false));
  expect(parsed.authors.length).toBe(2);
  expect(parsed.authors[0].affiliations.name).toBe('MIT');
  expect(parsed.authors[1].affiliations.name).toBe('Stanford');
});

test('frontmatter always sets bibliography to submission.bib and htmlwidgets:true', async () => {
  const parsed = yaml.load(await buildFrontmatter({}, false));
  expect(parsed.bibliography).toBe('submission.bib');
  expect(parsed.htmlwidgets).toBe(true);
});

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------

test('buildToc captures ## as top-level entries', () => {
  const toc = buildToc('## Intro\nfoo\n## Methods\nbar\n');
  expect(toc).toEqual([{ name: 'Intro' }, { name: 'Methods' }]);
});

test('buildToc nests ### under preceding ##', () => {
  const toc = buildToc('## Intro\n### Background\n### Setup\n## Methods\n');
  expect(toc.length).toBe(2);
  expect(toc[0].subsections).toEqual([{ name: 'Background' }, { name: 'Setup' }]);
});

test('collectTocFiles flattens nested children', () => {
  const files = collectTocFiles([
    { file: 'a.md' },
    { children: [{ file: 'b.md' }, { file: 'c.md' }] },
  ]);
  expect(files).toEqual(['a.md', 'b.md', 'c.md']);
});

// ---------------------------------------------------------------------------
// textOf — abstract extraction helper
// ---------------------------------------------------------------------------

test('textOf concatenates plain text from nested nodes', () => {
  const tree = paragraph(text('hello '), { type: 'strong', children: [text('world')] });
  expect(textOf(tree)).toBe('hello world');
});
