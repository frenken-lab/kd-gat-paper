#!/usr/bin/env bun
/**
 * Inspect the candidacy curvenote.com Project at the API level.
 *
 * Reports:
 *   - Block counts by kind (Article, Content, Image, Bibliography, ...)
 *   - The canonical "candidacy" Article's published version + Content child
 *   - PM doc node-type histogram + total text-character count
 *   - First and last 200 chars of all concatenated text content
 *
 * Usage: bun tools/curvenote/inspect.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const API = 'https://api.curvenote.com';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

const die = (m) => { console.error(m); process.exit(1); };

const TOKEN = process.env.CURVENOTE_TOKEN;
if (!TOKEN) die('CURVENOTE_TOKEN required.');

const FROM_EDITOR_YML = resolve(REPO_ROOT, 'paper/from-editor/curvenote.yml');
if (!existsSync(FROM_EDITOR_YML)) die(`Missing ${FROM_EDITOR_YML}.`);
const PROJECT = yaml.load(readFileSync(FROM_EDITOR_YML, 'utf8'))?.project?.id;

const session = await fetch(`${API}/login`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}` },
}).then((r) => r.json()).then((j) => j.session);
if (!session) die('Failed to obtain session JWT.');
const HDR = { Authorization: `Bearer ${session}`, 'X-ClientName': 'kd-gat-inspect' };

async function api(p) {
  const r = await fetch(`${API}${p}`, { headers: HDR });
  if (!r.ok) throw new Error(`GET ${p} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

console.log(`Project: ${PROJECT}\n`);

// 1. Block counts by kind --------------------------------------------------
const KINDS = ['Article', 'Content', 'Image', 'Bibliography', 'Navigation', 'Output', 'Notebook', 'Code'];
console.log('=== Block counts by kind ===');
for (const kind of KINDS) {
  try {
    const { items } = await api(`/blocks/${PROJECT}?kind=${kind}`);
    const n = items?.length || 0;
    console.log(`  ${kind.padEnd(13)}: ${n}`);
    for (const b of (items || [])) {
      const name = b.name || '<unnamed>';
      const title = (b.title || '').slice(0, 50);
      console.log(`    - ${b.id.block}  name="${name}"  title="${title}"  v${b.latest_version}`);
    }
  } catch (e) {
    console.log(`  ${kind.padEnd(13)}: error ${e.message.slice(0, 80)}`);
  }
}

// 2. Locate canonical Article ---------------------------------------------
const { items: articles } = await api(`/blocks/${PROJECT}?kind=Article`);
const candidacy = (articles || []).find((a) => a.name === 'candidacy');
if (!candidacy) die("\nNo Article named 'candidacy'.");

// Dump the full Article block, latest version, and default_draft so we can
// see EXACTLY where children are stored (data.children vs children vs
// elsewhere). The build.mjs comment claimed version.children is what the
// editor renders — but inspect run #1 showed v2.data.children = {} despite
// the editor apparently working. Need to learn the real schema.
function dumpKeys(obj, label, depth = 1) {
  if (!obj || typeof obj !== 'object') {
    console.log(`  ${label} = ${JSON.stringify(obj)}`);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) console.log(`  ${label}.${k} = null`);
    else if (typeof v !== 'object') console.log(`  ${label}.${k} = ${JSON.stringify(v).slice(0, 80)}`);
    else if (Array.isArray(v)) console.log(`  ${label}.${k} = Array[${v.length}]`);
    else console.log(`  ${label}.${k} = Object{${Object.keys(v).join(',').slice(0, 80)}}`);
  }
}

console.log(`\n=== Article block ===`);
const articleBlock = await api(`/blocks/${PROJECT}/${candidacy.id.block}`);
dumpKeys(articleBlock, 'block');

console.log(`\n=== Article latest_version (v${candidacy.latest_version}) ===`);
const articleVersion = await api(
  `/blocks/${PROJECT}/${candidacy.id.block}/versions/${candidacy.latest_version}`,
);
dumpKeys(articleVersion, 'version');
dumpKeys(articleVersion.data, 'version.data');
const articleChildren = articleVersion.data?.children || {};
console.log(`  version.data.children entries: ${Object.keys(articleChildren).length}`);

if (articleBlock.default_draft) {
  console.log(`\n=== Article default_draft ===`);
  try {
    const draft = await api(`/drafts/${PROJECT}/${candidacy.id.block}/${articleBlock.default_draft}`);
    dumpKeys(draft, 'draft');
    dumpKeys(draft.data, 'draft.data');
    const draftChildren = draft.data?.children || {};
    console.log(`  draft.data.children entries: ${Object.keys(draftChildren).length}`);
    for (const [cid, child] of Object.entries(draftChildren)) {
      console.log(
        `    ${cid} → block=${child.src?.block} v=${child.src?.version} draft=${child.src?.draft}`,
      );
    }
  } catch (e) {
    console.log(`  draft fetch failed: ${e.message.slice(0, 200)}`);
  }
}

// Children live at version.children (top-level), NOT version.data.children.
// Article version has version.data === undefined; the schema puts children
// directly on the version object. Same may apply to Content version's PM
// doc — must dump to find out.
const articleChildrenReal = articleVersion.children || {};
console.log(`  version.children entries: ${Object.keys(articleChildrenReal).length}`);
for (const [cid, child] of Object.entries(articleChildrenReal)) {
  console.log(
    `    ${cid} → block=${child.src?.block} v=${child.src?.version} draft=${child.src?.draft}`,
  );
}

const firstChild = Object.values(articleChildrenReal)[0];
if (!firstChild) {
  console.log('\nArticle version has no children. Stopping.');
  process.exit(0);
}

const cVersion = await api(
  `/blocks/${PROJECT}/${firstChild.src.block}/versions/${firstChild.src.version}`,
);
console.log(`\n=== Content version ${firstChild.src.version} structure ===`);
dumpKeys(cVersion, 'cv');
console.log(`  cv.content type: ${typeof cVersion.content}`);

// cv.format = 'html'. cv.content is a string of rendered HTML, NOT PM JSON.
// PM JSON lives in the editable draft (cv.draft); the version stores the
// rendered output for display.
const html = cVersion.content;
if (typeof html !== 'string') {
  console.log('Content is not a string — unexpected. Stopping.');
  process.exit(0);
}

console.log(`\n=== Content HTML ===`);
console.log(`  HTML length    : ${html.length} chars`);
const stripped = html
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();
console.log(`  Plain-text len : ${stripped.length} chars`);

// Tag histogram — what actually rendered.
const tagCounts = {};
for (const m of html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b/g)) {
  tagCounts[m[1]] = (tagCounts[m[1]] || 0) + 1;
}
console.log(`\n=== HTML tag histogram (top 20) ===`);
for (const [tag, n] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${tag.padEnd(12)}: ${n}`);
}

console.log('\n=== Marker survival (substring match in HTML) ===');
const markers = [
  ['Adaptive Fusion of Graph-Based Ensembles', 'top-level title'],
  ['Controller Area Network', 'index.md prose'],
  ['Variational Graph Autoencoder', 'background.md'],
  ['thesis-level contribution', 'proposed-research.md'],
  ['Physics and Dynamic Controls', 'committee Q1'],
  ['Reinforcement Learning', 'committee Q4'],
  ['Broader Impact', 'broader-impact.md'],
  ['Test Performance on HCRL', 'main_results table title'],
  ['F1', 'table column header'],
  ['Algorithm 1: Graph Construction', 'admonition title (post-rewrite)'],
];
for (const [m, why] of markers) {
  const found = html.toLowerCase().includes(m.toLowerCase());
  console.log(`  ${found ? '✓' : '✗'} "${m}"  (${why})`);
}

console.log('\n=== First 400 chars of plain text ===');
console.log(stripped.slice(0, 400).split('\n').map((l) => '  ' + l).join('\n'));
console.log('\n=== Last 400 chars of plain text ===');
console.log(stripped.slice(-400).split('\n').map((l) => '  ' + l).join('\n'));

