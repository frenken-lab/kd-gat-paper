#!/usr/bin/env bun
// Build TMLR Beyond PDF submission from MyST AST.
//
// Reads site-build AST JSON (_build/site/content/*.json) and serializes to
// Distill-layout markdown. Body serialization rides on mdast-util-to-markdown's
// defaultHandlers (paragraphs, lists, headings, links, code, emphasis,
// strong, html, text, etc.) plus gfm-table; only the Distill-flavored nodes
// have custom handlers below.
//
// Prereq: `myst build --site` produced _build/site/{content,config.json}.

import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, basename, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import yaml from 'js-yaml';
import { defaultHandlers, toMarkdown } from 'mdast-util-to-markdown';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE_CONTENT = join(ROOT, '_build', 'site', 'content');
const SITE_CONFIG = join(ROOT, '_build', 'site', 'config.json');
const TABLE_DIR = join(ROOT, '_build', 'tables');

// ---------------------------------------------------------------------------
// AST → Distill markdown handlers
// ---------------------------------------------------------------------------

function textOf(node) {
  if (node.type === 'text') return node.value || '';
  return (node.children || []).map(textOf).join('');
}

const flow = (node, _parent, state, info) => state.containerFlow(node, info);
const phrasing = (node, _parent, state, info) => state.containerPhrasing(node, info);

const cite = (node) => {
  const key = node.label || node.identifier;
  return `<d-cite key="${key}"></d-cite>`;
};

const citeGroup = (node) =>
  (node.children || [])
    .filter((c) => c.type === 'cite')
    .map(cite)
    .join('');

const crossReference = (node, _parent, state, info) => {
  const { template, enumerator, identifier } = node;
  // Equation refs ride MathJax \eqref so AMS tagging produces a linked "(N)".
  if (identifier?.startsWith('eq-')) return `\\eqref{${identifier}}`;
  const inner =
    template && enumerator != null
      ? template.replace('%s', String(enumerator))
      : node.children?.length
        ? state.containerPhrasing(node, info)
        : identifier || '';
  return identifier ? `[${inner}](#${identifier})` : `[${inner}]`;
};

// MyST emits link nodes with internal `/foo` urls for cross-page links;
// rewrite to in-page anchors so the single-file submission resolves them.
const link = (node, parent, state, info) => {
  const url = node.url || '';
  if (url.startsWith('/') && !url.includes('.')) {
    const rewritten = { ...node, url: `#${url.replace(/^\/+|\/+$/g, '')}` };
    return defaultHandlers.link(rewritten, parent, state, info);
  }
  return defaultHandlers.link(node, parent, state, info);
};

const inlineMath = (node) => `$${node.value || ''}$`;
// AMS tags='ams' is set in the TMLR kit (mathjax.html); numbered envs auto-number
// and \label binds the cross-ref target. For unnumbered authoring (\begin{aligned}
// or no env), drop an <a id> anchor so #identifier links still resolve.
const math = (node) => {
  const value = node.value || '';
  const isNumberedEnv = /\\begin\{(equation|align|gather|multline)\*?\}/.test(value);
  const id = node.identifier ? `<a id="${node.identifier}"></a>\n` : '';
  if (isNumberedEnv || !node.identifier) {
    return `\n${id}$$\n${value}\n$$\n`;
  }
  return `\n${id}$$\n\\begin{equation}\\label{${node.identifier}}\n${value}\n\\end{equation}\n$$\n`;
};

const iframe = (node) => {
  // Initial height is a placeholder; figure-resize.ts grows the iframe to fit
  // its content (same-origin direct write on Pages, postMessage elsewhere).
  const raw = node.src || '';
  const src = basename(raw.replace(/[?#].*$/, ''));
  const path = `assets/html/submission/${src}`;
  const title = src.replace(/\.html?$/i, '');
  return (
    `<iframe src="{{ '${path}' | relative_url }}" ` +
    `width="100%" height="400" ` +
    `style="border:none; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" ` +
    `title="${title}"></iframe>`
  );
};

const image = (node) => {
  const raw = node.urlSource || node.url || '';
  const src = basename(raw.replace(/[?#].*$/, ''));
  const path = `assets/images/${src}`;
  const width = node.width || '100%';
  const alt = node.alt || '';
  const urlExpr = `{{ '${path}' | relative_url }}`;
  if (src.toLowerCase().endsWith('.pdf')) {
    return `<embed src="${urlExpr}" type="application/pdf" style="width:${width}; height:400px; display:block; margin:0 auto;" title="${alt}" />`;
  }
  return `<img src="${urlExpr}" style="width:${width}; display:block; margin:0 auto;" alt="${alt}" />`;
};

// MyST {dropdown} → HTML5 <details> with markdown="1" so Jekyll renders inner.
const details = (node, _parent, state, info) => {
  const openAttr = node.open ? ' open' : '';
  let summary = '';
  const bodyParts = [];
  for (const child of node.children || []) {
    if (child.type === 'summary') {
      summary = state.containerPhrasing(child, info);
    } else {
      bodyParts.push(serializeChild(child, state, info));
    }
  }
  return (
    `\n<details${openAttr} markdown="1">\n` +
    `<summary>${summary}</summary>\n` +
    `<div markdown="1">\n\n` +
    `${bodyParts.join('\n')}\n` +
    `</div>\n` +
    `</details>\n`
  );
};

// MyST {tab-set} → sequential sections (bold headers). Bootstrap nav-tabs
// don't survive Distill's <d-article> DOM rewriting in template.v2.js.
const tabSet = (node, _parent, state, info) => {
  const tabs = (node.children || []).filter((c) => c.type === 'tabItem');
  if (!tabs.length) return state.containerFlow(node, info);
  const parts = [];
  for (const tab of tabs) {
    const title = tab.title || '';
    const body = (tab.children || [])
      .map((c) => serializeChild(c, state, info))
      .join('');
    parts.push(`\n**${title}**\n${body}`);
  }
  return parts.join('\n') + '\n';
};

// Algorithm admonitions get inline CSS so Distill renders the algorithm box
// without an external stylesheet. Plain admonitions degrade to blockquotes.
const admonition = (node, _parent, state, info) => {
  let title = '';
  const bodyParts = [];
  for (const child of node.children || []) {
    if (child.type === 'admonitionTitle') {
      title = state.containerPhrasing(child, info);
    } else {
      bodyParts.push(serializeChild(child, state, info).trim());
    }
  }
  const cls = node.class || '';
  if (cls.includes('algorithm')) {
    const box =
      "border:1px solid #4a86c8; border-radius:4px; padding:16px 20px; margin:24px 0; background:#f8faff; font-family:'Times New Roman',serif;";
    const cap =
      "font-weight:700; font-size:14px; margin:0 0 12px; padding-bottom:8px; border-bottom:1px solid #ccd9f0; color:#0066cc; font-family:system-ui,-apple-system,sans-serif;";
    const algoCss =
      '<style>' +
      '.algorithm table { width:100%; border-collapse:collapse; }' +
      '.algorithm th { display:none; }' +
      '.algorithm td { border:none; padding:2px 8px; vertical-align:top; line-height:1.6; }' +
      '.algorithm td:first-child { width:2em; text-align:right; color:#8899aa; font-size:0.85em; padding-right:12px; }' +
      '.algorithm td:last-child { text-align:right; color:#6688aa; font-style:italic; font-size:0.9em; white-space:nowrap; }' +
      '.algorithm tr:hover td { background:#e8f0ff; transition:background 0.15s; }' +
      '.algorithm tr:hover td:first-child { color:#0066cc; }' +
      '</style>\n';
    return (
      `\n${algoCss}<div class="algorithm" style="${box}" markdown="1">\n` +
      `<p style="${cap}">${title}</p>\n\n` +
      `${bodyParts.join('\n\n')}\n\n</div>\n`
    );
  }
  if (!title && !bodyParts.length) return '';
  const quoted = bodyParts
    .flatMap((p) => p.split('\n'))
    .map((l) => (l ? `> ${l}` : '>'))
    .join('\n');
  return title ? `\n> **${title}**\n>\n${quoted}\n` : `\n${quoted}\n`;
};

const container = (node, _parent, state, info) => {
  const kind = node.kind || '';
  const children = node.children || [];
  if (kind === 'figure') {
    const idAttr = node.identifier ? ` id="${node.identifier}"` : '';
    const inner = children.map((c) => serializeChild(c, state, info)).join('');
    return `\n<figure${idAttr}>\n${inner}\n</figure>\n`;
  }
  if (kind === 'table') {
    // Tables are pre-rendered as great-tables HTML by tools/tables/build.py
    // and emitted to _build/tables/<name>.md. We copy that HTML through
    // verbatim — the AST representation drops the inline styles great-tables
    // produces, and parsing the HTML back through MyST gives us mdast `div`
    // nodes that toMarkdown can't serialize anyway.
    let cap = '';
    let body = '';
    const label = node.identifier || '';
    if (label.startsWith('tbl-')) {
      const tableName = label.slice(4).replaceAll('-', '_');
      const htmlPath = join(TABLE_DIR, `${tableName}.md`);
      if (existsSync(htmlPath)) {
        body = `\n${readFileSync(htmlPath, 'utf8').trim()}\n`;
      } else {
        console.warn(`warning: ${htmlPath} not found; run 'make tables' first`);
      }
    }
    for (const c of children) {
      if (c.type === 'caption') {
        // containerPhrasing preserves <d-cite>, emphasis, links inside captions.
        cap = state.containerPhrasing(c, info).trim();
      }
    }
    // Wrap in <figure> so cross-refs to #tbl-* resolve and Distill styles
    // figcaption. markdown="1" lets kramdown process content inside.
    const idAttr = node.identifier ? ` id="${node.identifier}"` : '';
    const num = node.enumerator ? `<strong>Table ${node.enumerator}:</strong> ` : '';
    const figcap = cap ? `<figcaption>${num}${cap}</figcaption>\n` : '';
    return `\n<figure${idAttr} markdown="1">\n${figcap}${body}\n</figure>\n`;
  }
  return state.containerFlow(node, info);
};

const caption = (node, _parent, state, info) =>
  `\n<figcaption>${state.containerPhrasing(node, info)}</figcaption>`;

const captionNumber = (node, _parent, state, info) =>
  `${state.containerPhrasing(node, info)} `;

// Strip {#anchor} suffixes that MyST leaks into text nodes.
const text = (node) => (node.value || '').replace(/\s*\{#[^}]+\}\s*$/, '');

const handlers = {
  // Defaults provide: paragraph, heading, list, listItem, link (overridden),
  // image (overridden), strong, emphasis, code, inlineCode, html, blockquote,
  // thematicBreak, text (overridden), root, definition, imageReference,
  // linkReference, break.
  ...defaultHandlers,

  // Overrides
  text,
  link,
  image,

  // MyST-specific leaves
  inlineMath,
  math,
  cite,
  citeGroup,
  crossReference,
  iframe,

  // MyST-specific containers
  container,
  admonition,
  admonitionTitle: () => '',
  details,
  summary: phrasing,
  tabSet,
  tabItem: flow,
  caption,
  captionNumber,

  // Transparent block wrappers (mystmd emits these; not in defaultHandlers).
  block: flow,
  include: flow,
  legend: flow,
  outputs: flow,

  // mystmd sometimes emits these; treat as comment / no-op.
  comment: () => '',
  raw: (node) => node.value || '',
  mystComment: () => '',
};

// Dispatch a child node when a parent handler needs per-child slicing
// (admonition, container[figure|table], details, tabSet). Goes through
// state.handle so extension-registered handlers (gfm-table) participate;
// otherwise table nodes nested inside containers vanish.
function serializeChild(node, state, info) {
  return state.handle(node, undefined, state, info) || '';
}

function serialize(tree) {
  return toMarkdown(tree, {
    bullet: '-',
    fences: true,
    rule: '-',
    handlers,
    extensions: [gfmTableToMarkdown()],
  });
}

// ---------------------------------------------------------------------------
// Build orchestration
// ---------------------------------------------------------------------------

async function buildFrontmatter(proj, anonymous) {
  let abstract = '';
  const idxPath = join(SITE_CONTENT, 'index.json');
  if (existsSync(idxPath)) {
    const idxData = JSON.parse(await readFile(idxPath, 'utf8'));
    let abstractAst = idxData?.frontmatter?.parts?.abstract?.mdast;
    if (typeof abstractAst === 'string') abstractAst = JSON.parse(abstractAst);
    if (abstractAst) {
      abstract = textOf(abstractAst);
    } else {
      console.warn('warning: abstract not found in index.json frontmatter');
    }
  }

  let authors;
  if (anonymous) {
    authors = [{ name: 'Anonymous', affiliations: { name: 'Anonymous' } }];
  } else {
    authors = (proj.authors || []).map((a) => {
      const entry = { name: a.name || '' };
      const affs = a.affiliations || [];
      if (affs.length) {
        const first = affs[0];
        entry.affiliations = { name: typeof first === 'string' ? first : first?.name || '' };
      }
      return entry;
    });
  }

  return yaml.dump(
    {
      layout: 'distill',
      title: proj.title || '',
      description: abstract,
      htmlwidgets: true,
      authors,
      bibliography: 'submission.bib',
    },
    { sortKeys: false, lineWidth: -1 }
  );
}

function buildToc(content) {
  const entries = [];
  for (const line of content.split('\n')) {
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      entries.push({ name: line.slice(3).trim() });
    } else if (line.startsWith('### ') && entries.length) {
      const last = entries[entries.length - 1];
      last.subsections = last.subsections || [];
      last.subsections.push({ name: line.slice(4).trim() });
    }
  }
  return entries;
}

function collectTocFiles(toc) {
  const files = [];
  for (const entry of toc || []) {
    if (entry && typeof entry === 'object') {
      if (entry.file) files.push(entry.file);
      files.push(...collectTocFiles(entry.children));
    }
  }
  return files;
}

async function copyAssets(out) {
  await mkdir(join(out, 'assets', 'html', 'submission'), { recursive: true });
  await mkdir(join(out, 'assets', 'bibliography'), { recursive: true });

  const bibDir = join(ROOT, 'paper', 'references');
  if (existsSync(bibDir)) {
    const bibs = (await readdir(bibDir)).filter((f) => f.endsWith('.bib')).sort();
    const dest = join(out, 'assets', 'bibliography', 'submission.bib');
    const parts = [];
    for (const b of bibs) parts.push(await readFile(join(bibDir, b), 'utf8'));
    await writeFile(dest, parts.join('\n'));
  }

  const figuresDir = join(ROOT, '_build', 'figures');
  if (existsSync(figuresDir)) {
    for (const f of await readdir(figuresDir)) {
      if (f.endsWith('.html')) {
        await copyFile(join(figuresDir, f), join(out, 'assets', 'html', 'submission', f));
      }
    }
  }

  const imagesDir = join(ROOT, 'images');
  if (existsSync(imagesDir)) {
    await mkdir(join(out, 'assets', 'images'), { recursive: true });
    for (const f of await readdir(imagesDir)) {
      const ext = extname(f).toLowerCase();
      if (['.png', '.svg', '.pdf'].includes(ext) && !f.endsWith(':Zone.Identifier')) {
        await copyFile(join(imagesDir, f), join(out, 'assets', 'images', f));
      }
    }
  }
}

async function build({ output, anonymous = false } = {}) {
  if (!output) throw new Error('build: output is required');

  if (!existsSync(SITE_CONTENT) || !existsSync(SITE_CONFIG)) {
    throw new Error("_build/site/content/ not found. Run 'myst build --site' first.");
  }

  const siteCfg = JSON.parse(await readFile(SITE_CONFIG, 'utf8'));
  const proj = (siteCfg.projects || [{}])[0];

  const tocFiles = collectTocFiles(proj.toc || []);
  const parts = [];
  for (const rel of tocFiles) {
    const stem = basename(rel).replace(/\.[^.]+$/, '');
    const astPath = join(SITE_CONTENT, `${stem}.json`);
    if (!existsSync(astPath)) {
      console.log(`  skip: ${rel} (no AST)`);
      continue;
    }
    const data = JSON.parse(await readFile(astPath, 'utf8'));
    let mdast = data.mdast;
    if (typeof mdast === 'string') mdast = JSON.parse(mdast);
    if (mdast == null) {
      console.warn(`warning: no 'mdast' key in ${stem}.json`);
      continue;
    }
    parts.push(serialize(mdast));
    console.log(`  ok: ${rel}`);
  }

  if (!parts.length) throw new Error('No content serialized');

  const content = parts.join('\n\n').replace(/\n{3,}/g, '\n\n');

  const out = resolve(output);
  await mkdir(out, { recursive: true });

  const frontmatter = await buildFrontmatter(proj, anonymous);
  const tocEntries = buildToc(content);
  const toc = tocEntries.length ? yaml.dump({ toc: tocEntries }, { sortKeys: false }) : '';
  const submissionPath = join(out, 'submission.md');
  await writeFile(submissionPath, `---\n${frontmatter}${toc}---\n\n${content}`);

  await copyAssets(out);
  console.log(`Done: ${submissionPath}`);
  return submissionPath;
}

async function main() {
  const { values } = parseArgs({
    options: {
      output: { type: 'string', short: 'o' },
      anonymous: { type: 'boolean', default: false },
    },
  });
  if (!values.output) {
    console.error('ERROR: --output/-o is required');
    process.exit(2);
  }
  await build({ output: values.output, anonymous: values.anonymous });
}

export { build, serialize, buildFrontmatter, buildToc, collectTocFiles, textOf, handlers };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
