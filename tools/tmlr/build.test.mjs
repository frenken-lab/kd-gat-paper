// Semantic-property tests for the TMLR serializer.
//
// Tests check observable Distill features (d-cite tags, math fences,
// iframe paths, algorithm CSS, figure wrappers, table HTML fallback)
// rather than exact byte-for-byte output. Exact output is the
// responsibility of mdast-util-to-markdown; we test only the
// Distill-flavored handlers we own.
//
// Run: cd tools/tmlr && npm test  (or `node --test build.test.mjs`)

import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.match(out, /<d-cite key="myref"><\/d-cite>/);
});

test('cite uses label field when present', () => {
  const out = serialize(root(paragraph(cite('id-a', 'label-a'))));
  assert.match(out, /<d-cite key="label-a"><\/d-cite>/);
  assert.doesNotMatch(out, /key="id-a"/);
});

test('citeGroup concatenates children into a run of <d-cite> tags', () => {
  const out = serialize(root(paragraph(citeGroup(cite('a'), cite('b'), cite('c')))));
  assert.match(out, /<d-cite key="a"><\/d-cite><d-cite key="b"><\/d-cite><d-cite key="c"><\/d-cite>/);
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
  assert.match(out, /<d-cite key="book"><\/d-cite>/);
});

// ---------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------

test('inlineMath wraps in single $', () => {
  const out = serialize(root(paragraph(inlineMath('x^2'))));
  assert.match(out, /\$x\^2\$/);
});

test('block math fenced with $$', () => {
  const out = serialize(root(blockMath('y = mx + b')));
  assert.match(out, /\$\$\ny = mx \+ b\n\$\$/);
});

// ---------------------------------------------------------------------------
// Cross-references
// ---------------------------------------------------------------------------

test('crossReference uses template + enumerator when both present', () => {
  const out = serialize(root(paragraph(xref({ identifier: 'fig:x', template: 'Figure %s', enumerator: 3 }))));
  assert.match(out, /Figure 3/);
});

test('crossReference falls back to identifier when no template', () => {
  const out = serialize(root(paragraph(xref({ identifier: 'foo' }))));
  assert.match(out, /\[foo\]/);
});

// ---------------------------------------------------------------------------
// iframe — Jekyll relative_url + asset path
// ---------------------------------------------------------------------------

test('iframe rewrites src to assets/html/submission/<basename>', () => {
  const out = serialize(root(iframe('https://frenken-lab.github.io/kd-gat-paper/figures/umap.html')));
  assert.match(out, /<iframe src="\{\{ 'assets\/html\/submission\/umap\.html' \| relative_url \}\}"/);
});

test('iframe strips query strings and fragments', () => {
  const out = serialize(root(iframe('umap.html?v=1#anchor')));
  assert.match(out, /'assets\/html\/submission\/umap\.html'/);
  assert.doesNotMatch(out, /v=1|#anchor/);
});

// ---------------------------------------------------------------------------
// Image — PDF embed branch + Jekyll path
// ---------------------------------------------------------------------------

test('image uses Jekyll relative_url and assets/images path', () => {
  const out = serialize(root(image({ url: 'figs/architecture.png', alt: 'arch' })));
  assert.match(out, /'assets\/images\/architecture\.png'/);
  assert.match(out, /alt="arch"/);
});

test('image with .pdf extension renders as <embed>', () => {
  const out = serialize(root(image({ url: 'figs/diagram.pdf' })));
  assert.match(out, /<embed src="\{\{ 'assets\/images\/diagram\.pdf' \| relative_url \}\}"/);
  assert.match(out, /type="application\/pdf"/);
});

// ---------------------------------------------------------------------------
// Algorithm admonition — inline CSS
// ---------------------------------------------------------------------------

test('admonition with class="algorithm" emits algorithm-styled div', () => {
  const out = serialize(root(admonition([text('Algorithm 1')], [paragraph(text('body'))], 'algorithm')));
  assert.match(out, /<div class="algorithm"/);
  assert.match(out, /<style>\.algorithm/);
  assert.match(out, /Algorithm 1/);
});

test('plain admonition degrades to blockquote', () => {
  const out = serialize(root(admonition([text('Note')], [paragraph(text('hello'))], '')));
  assert.match(out, /^>\s*\*\*Note\*\*/m);
  assert.match(out, /^>\s*hello/m);
});

// ---------------------------------------------------------------------------
// Container — figure wrapper + table fallback identifier handling
// ---------------------------------------------------------------------------

test('container[figure] wraps children in <figure id="..."> tags', () => {
  const out = serialize(root(figureContainer('fig:foo', iframe('foo.html'), caption(text('cap')))));
  assert.match(out, /<figure id="fig:foo">/);
  assert.match(out, /<\/figure>/);
});

test('container[table] without tbl- identifier falls through to inline rendering', () => {
  // No HTML fallback — should render the table from AST.
  const out = serialize(root(
    tableContainer('plain-id',
      caption(text('My caption')),
      tableNode(tableRow(tableCell(text('A'))), tableRow(tableCell(text('1'))))
    )
  ));
  assert.match(out, /\*\*My caption\*\*/);
  // Pipe table should appear (gfm-table extension).
  assert.match(out, /\| A\s*\|/);
});

// ---------------------------------------------------------------------------
// Tabs and details
// ---------------------------------------------------------------------------

test('tabSet renders each tab as a bold-titled section (Distill nav-tabs are blocked)', () => {
  const out = serialize(root(tabSet(
    tabItem('First', paragraph(text('one'))),
    tabItem('Second', paragraph(text('two')))
  )));
  assert.match(out, /\*\*First\*\*/);
  assert.match(out, /\*\*Second\*\*/);
});

test('details emits <details markdown="1"> with summary and body', () => {
  const out = serialize(root(detailsNode([text('Click')], [paragraph(text('hidden'))], true)));
  assert.match(out, /<details open markdown="1">/);
  assert.match(out, /<summary>Click<\/summary>/);
  assert.match(out, /hidden/);
});

// ---------------------------------------------------------------------------
// Internal link rewriting
// ---------------------------------------------------------------------------

test('internal /foo links rewrite to in-page #foo anchors', () => {
  const out = serialize(root(paragraph(link('/methodology', text('see method')))));
  assert.match(out, /\[see method\]\(#methodology\)/);
});

test('external links pass through unchanged', () => {
  const out = serialize(root(paragraph(link('https://example.com', text('ex')))));
  assert.match(out, /\[ex\]\(https:\/\/example\.com\)/);
});

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

test('frontmatter sets distill layout', async () => {
  const fm = await buildFrontmatter({}, false);
  assert.equal(yaml.load(fm).layout, 'distill');
});

test('frontmatter title comes from project', async () => {
  const fm = await buildFrontmatter({ title: 'My Paper' }, false);
  assert.equal(yaml.load(fm).title, 'My Paper');
});

test('anonymous mode replaces all authors with single Anonymous', async () => {
  const proj = { authors: [{ name: 'Alice', affiliations: ['MIT'] }] };
  const fm = await buildFrontmatter(proj, true);
  const parsed = yaml.load(fm);
  assert.equal(parsed.authors.length, 1);
  assert.equal(parsed.authors[0].name, 'Anonymous');
});

test('non-anonymous preserves authors, normalizes affiliation shape', async () => {
  const proj = {
    authors: [
      { name: 'Alice', affiliations: ['MIT'] },
      { name: 'Bob', affiliations: [{ name: 'Stanford' }] },
    ],
  };
  const parsed = yaml.load(await buildFrontmatter(proj, false));
  assert.equal(parsed.authors.length, 2);
  assert.equal(parsed.authors[0].affiliations.name, 'MIT');
  assert.equal(parsed.authors[1].affiliations.name, 'Stanford');
});

test('frontmatter always sets bibliography to submission.bib and htmlwidgets:true', async () => {
  const parsed = yaml.load(await buildFrontmatter({}, false));
  assert.equal(parsed.bibliography, 'submission.bib');
  assert.equal(parsed.htmlwidgets, true);
});

// ---------------------------------------------------------------------------
// TOC
// ---------------------------------------------------------------------------

test('buildToc captures ## as top-level entries', () => {
  const toc = buildToc('## Intro\nfoo\n## Methods\nbar\n');
  assert.deepEqual(toc, [{ name: 'Intro' }, { name: 'Methods' }]);
});

test('buildToc nests ### under preceding ##', () => {
  const toc = buildToc('## Intro\n### Background\n### Setup\n## Methods\n');
  assert.equal(toc.length, 2);
  assert.deepEqual(toc[0].subsections, [{ name: 'Background' }, { name: 'Setup' }]);
});

test('collectTocFiles flattens nested children', () => {
  const files = collectTocFiles([
    { file: 'a.md' },
    { children: [{ file: 'b.md' }, { file: 'c.md' }] },
  ]);
  assert.deepEqual(files, ['a.md', 'b.md', 'c.md']);
});

// ---------------------------------------------------------------------------
// textOf — abstract extraction helper
// ---------------------------------------------------------------------------

test('textOf concatenates plain text from nested nodes', () => {
  const tree = paragraph(text('hello '), { type: 'strong', children: [text('world')] });
  assert.equal(textOf(tree), 'hello world');
});
