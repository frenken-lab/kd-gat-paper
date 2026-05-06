#!/usr/bin/env bun
/**
 * buildv2.mjs — Split the candidacy into typed content atoms, upload each
 * as its own Content block, and compose them as an ordered Article.
 *
 * Fixes the gap in build.mjs where tables/iframes/figures were silently
 * dropped by @curvenote/schema's fromMarkdown when passed as one body.
 * Each +++ {"type":"..."} block in the source is dispatched to a dedicated
 * PM builder instead of being coerced through the prose path.
 *
 * Usage:
 *   bun tools/curvenote/buildv2.mjs              # build + push
 *   bun tools/curvenote/buildv2.mjs --dry-run    # assemble + stats, no network
 */

const DRY_RUN = process.argv.slice(2).includes('--dry-run');
const LINT = process.argv.slice(2).includes('--lint');

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { fromMarkdown, server } from '@curvenote/schema';

const API = 'https://api.curvenote.com';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

const die = (m) => { console.error(m); process.exit(1); };

// ── config ────────────────────────────────────────────────────────────────────

const TOKEN = process.env.CURVENOTE_TOKEN;
if (!TOKEN && !DRY_RUN) die('CURVENOTE_TOKEN env var required (source ~/.env.local).');

const FROM_EDITOR_YML = resolve(REPO_ROOT, 'paper/from-editor/curvenote.yml');
if (!existsSync(FROM_EDITOR_YML)) die(`Missing ${FROM_EDITOR_YML}.\nRun: bunx -y curvenote@0.14.3 clone <project-url> paper/from-editor/`);
const PROJECT = yaml.load(readFileSync(FROM_EDITOR_YML, 'utf8'))?.project?.id;
if (!PROJECT) die(`No project.id in ${FROM_EDITOR_YML}.`);

const CANDIDACY_YML = resolve(REPO_ROOT, 'myst.candidacy.yml');
if (!existsSync(CANDIDACY_YML)) die(`Missing ${CANDIDACY_YML}.`);
const cfg = yaml.load(readFileSync(CANDIDACY_YML, 'utf8'));
const TOC = cfg?.project?.toc;
const TITLE = cfg?.project?.title || 'Candidacy';
if (!TOC) die(`No project.toc in ${CANDIDACY_YML}.`);

console.log(`Project: ${PROJECT}  (${TITLE})`);

// ── pure layer ────────────────────────────────────────────────────────────────

function readFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  try { return m ? yaml.load(m[1]) || {} : {}; } catch { return {}; }
}

function stripFrontmatter(md) {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? md.slice(m[0].length) : md;
}

function demoteHeadings(md, by = 1) {
  return md.replace(/^(#{1,5})(\s)/gm, (_, h, ws) => '#'.repeat(h.length + by) + ws);
}

function rewriteAdmonitionTitles(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(:{3,})\{admonition\}\s+(.+?)\s*$/);
    if (!m) { out.push(lines[i++]); continue; }
    const [, fence, title] = m;
    out.push(`${fence}{admonition}`);
    i++;
    while (i < lines.length && /^:[a-zA-Z][a-zA-Z0-9_-]*:/.test(lines[i])) out.push(lines[i++]);
    if (i < lines.length && lines[i].trim() === '') { out.push(lines[i++]); }
    out.push(`**${title}**`);
    out.push('');
  }
  return out.join('\n');
}

// Like build.mjs sanitize BUT preserves +++ lines — they are atom separators.
function sanitize(md) {
  return rewriteAdmonitionTitles(md)
    .replace(/^%%.*$/gm, '')
    .replace(/^\([^)]+\)=\s*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(#[^)]+\)/g, '$1')
    .replace(/\[\]\(#([^)]+)\)/g, '$1');
}

function expandIncludes(md, baseDir, depth = 0) {
  if (depth > 8) throw new Error(`Include depth > 8 from ${baseDir}`);
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^```\{include\}\s+(.+?)\s*$/);
    if (!m) { out.push(lines[i++]); continue; }
    const target = m[1]; i++;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) i++;
    if (i < lines.length) i++;
    const includePath = resolve(baseDir, target);
    const gfmVariant = includePath.replace(/\.md$/, '.gfm.md');
    const chosen = existsSync(gfmVariant) ? gfmVariant : includePath;
    if (!existsSync(chosen)) {
      console.warn(`  ! include not found: ${target} (from ${baseDir})`);
      out.push(`<!-- missing: ${target} -->`);
      continue;
    }
    out.push(expandIncludes(stripFrontmatter(readFileSync(chosen, 'utf8')), dirname(chosen), depth + 1));
  }
  return out.join('\n');
}

// Assemble one top-level TOC entry's full content, inlining children with demoted headings.
// Returns { title, markdown }.
function assembleEntry(entry, level = 1) {
  const abs = resolve(REPO_ROOT, entry.file);
  if (!existsSync(abs)) { console.warn(`  ! TOC file not found: ${entry.file}`); return { title: entry.title || entry.file, markdown: '' }; }
  const raw = readFileSync(abs, 'utf8');
  const fm = readFrontmatter(raw);
  let body = expandIncludes(stripFrontmatter(raw), dirname(abs));
  if (level > 1) body = demoteHeadings(body, level - 1);
  const title = entry.title || fm.title || entry.file;
  const parts = [body.trim()];
  if (Array.isArray(entry.children)) {
    for (const child of entry.children) {
      const { markdown } = assembleEntry(child, level + 1);
      if (markdown) parts.push(markdown);
    }
  }
  return { title, markdown: parts.join('\n\n') };
}

// Split assembled markdown on +++ separators into typed atoms.
// +++ {"type":"table"} starts a typed atom; bare +++ ends it (next content is prose).
function parseBlocks(md) {
  const atoms = [];
  const lines = md.split('\n');
  let meta = null; // null = prose
  let buf = [];

  const flush = () => {
    const content = buf.join('\n').trim();
    buf = [];
    if (!content && meta === null) return;
    const type = meta ? (JSON.parse(meta).type ?? 'prose') : 'prose';
    atoms.push({ type, content });
    meta = null;
  };

  for (const line of lines) {
    const m = line.match(/^\+\+\+\s*(\{.*\})?\s*$/);
    if (m) {
      flush();
      if (m[1]) meta = m[1]; // typed atom starts; bare +++ just closes
    } else {
      buf.push(line);
    }
  }
  flush();
  return atoms;
}

// Extract unique cite keys from assembled markdown.
// Handles both [@key] and [@key1; @key2] forms (standard MyST/pandoc syntax).
function bibKeys(md) {
  const keys = new Set();
  for (const m of md.matchAll(/@([a-zA-Z][a-zA-Z0-9_:.-]*)/g)) {
    keys.add(m[1]);
  }
  return [...keys];
}

// Parse inline text for bold (**text**), returning PM inline nodes.
function parseInline(text) {
  const parts = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) });
    parts.push({ type: 'text', text: m[1], marks: [{ type: 'strong' }] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return parts.length ? parts : (text ? [{ type: 'text', text }] : []);
}

// Build PM JSON for a GFM table found inside a +++ {"type":"table"} atom.
// Extracts all | ... | rows and emits table > table_row > table_header/table_cell.
// Cell content model is blockOrEquation, so text is wrapped in a paragraph.
function gfmTableToPM(content) {
  const rows = content.split('\n').filter(l => /^\s*\|/.test(l));
  if (rows.length < 2) return null;
  const parseRow = (l) => l.split('|').slice(1, -1).map(c => c.trim());
  const header = parseRow(rows[0]);
  // rows[1] is the --- separator; skip it
  const body = rows.slice(2).map(parseRow).filter(r => r.length === header.length);

  const cell = (text, isHeader) => ({
    type: isHeader ? 'table_header' : 'table_cell',
    attrs: { align: null, colspan: 1, rowspan: 1, background: null },
    content: [{ type: 'paragraph', content: parseInline(text) }],
  });
  const row = (cells, isHeader) => ({ type: 'table_row', content: cells.map(c => cell(c, isHeader)) });

  return {
    type: 'doc',
    content: [{ type: 'table', content: [row(header, true), ...body.map(r => row(r, false))] }],
  };
}

// Build PM JSON for an iframe atom: a single iframe node with the extracted src.
// width is integer per @curvenote/schema (build.mjs bug: passed '100%' string).
function iframeToPM(content) {
  const m = content.match(/:::\{iframe\}\s+(\S+)/);
  if (!m) { console.warn('  ! iframe: no URL found in atom'); return null; }
  return { type: 'doc', content: [{ type: 'iframe', attrs: { src: m[1], align: 'center', width: 70 } }] };
}

// Build PM JSON for a figure atom: figure > image + figcaption.
function figureToPM(content) {
  const m = content.match(/:::\{figure\}\s+(\S+)/);
  if (!m) { console.warn('  ! figure: no URL found in atom'); return null; }
  const src = m[1];
  const lines = content.split('\n');
  const captionLines = [];
  let pastOpts = false;
  for (const l of lines) {
    if (/^:::/.test(l)) continue;
    if (/^:[a-z]/.test(l)) continue;
    if (l.trim() === '') { pastOpts = true; continue; }
    if (pastOpts) captionLines.push(l.trim());
  }
  const caption = captionLines.join(' ').trim();
  const imgNode = { type: 'image', attrs: { src, alt: caption || null, title: null, align: 'center', width: null } };
  const figContent = [imgNode];
  if (caption) {
    figContent.push({
      type: 'figcaption',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: caption }] }],
    });
  }
  return {
    type: 'doc',
    content: [{
      type: 'figure',
      attrs: { align: 'center', numbered: false, id: null, multipage: false, landscape: false, fullpage: false },
      content: figContent,
    }],
  };
}

// Build PM JSON for a prose atom. fromMarkdown handles MyST natively.
function proseToPM(content) {
  if (!content.trim()) return null;
  try {
    const doc = fromMarkdown(content, 'full');
    return doc ? doc.toJSON() : null;
  } catch (e) {
    console.warn(`  ! proseToPM error: ${e.message?.slice(0, 100)}`);
    return null;
  }
}

// Split prose atoms that exceed maxChars at heading boundaries.
// Prevents large single replace steps from hitting server 500s.
function chunkProse(atoms, maxChars = 8000) {
  const out = [];
  for (const atom of atoms) {
    if (atom.type !== 'prose' || atom.content.length <= maxChars) {
      out.push(atom);
      continue;
    }
    const lines = atom.content.split('\n');
    const chunks = [];
    let buf = [];
    for (const line of lines) {
      if (/^#{1,6} /.test(line) && buf.length) {
        const content = buf.join('\n').trim();
        if (content) chunks.push(content);
        buf = [];
      }
      buf.push(line);
    }
    const last = buf.join('\n').trim();
    if (last) chunks.push(last);
    for (const chunk of chunks) out.push({ type: 'prose', content: chunk });
  }
  return out;
}

// Stable Content block name for an atom, namespaced by article index.
// Pattern: /^[a-z0-9]{1}[a-z0-9-]{1,48}[a-z0-9]{1}$/ (3-50 chars).
// e.g. c01p000, c02t001
function atomName(articleN, type, n) {
  const p = { prose: 'p', table: 't', iframe: 'i', figure: 'f' }[type] ?? 'x';
  return `c${String(articleN).padStart(2, '0')}${p}${String(n).padStart(3, '0')}`;
}

// Check prose atoms for unwrapped table/figure/iframe directives.
// Any :::{table|figure|iframe} inside a prose atom means the source file is
// missing a +++ {"type":"..."} wrapper — the editor will silently drop it.
function lintEntries(entries) {
  const issues = [];
  for (const { title, atoms, artIdx } of entries) {
    for (const atom of atoms) {
      if (atom.type !== 'prose') continue;
      for (const line of atom.content.split('\n')) {
        if (/^:{3,}\{(table|figure|iframe)\}/.test(line)) {
          issues.push(`  [${String(artIdx).padStart(2, '0')}] "${title}": unwrapped ${line.trim()}`);
        }
      }
    }
  }
  return issues;
}

// ── effectful layer ───────────────────────────────────────────────────────────

let HDR;

async function api(method, path, body) {
  const opts = { method, headers: HDR };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(`${API}${path}`, opts);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${method} ${path} → ${r.status} ${t.slice(0, 400)}`);
  }
  if (r.status === 204) return null;
  return r.json();
}

// One-time cache of existing Content + Reference blocks by name, loaded after auth.
let blockCache = null;

async function loadBlockCache() {
  if (blockCache) return;
  blockCache = new Map();
  for (const kind of ['Content', 'Reference']) {
    try {
      // limit=500 to avoid truncation on large projects; API default may be ~100
      const { items } = await api('GET', `/blocks/${PROJECT}?kind=${kind}&limit=500`);
      for (const b of (items || [])) {
        if (b.name) blockCache.set(b.name, { id: b.id.block, kind });
      }
    } catch { /* non-fatal */ }
  }
  console.log(`  Block cache loaded: ${blockCache.size} named blocks`);
}

async function findOrCreate(kind, name, extra = {}) {
  if (blockCache?.has(name)) return blockCache.get(name).id;
  try {
    const b = await api('POST', `/blocks/${PROJECT}`, { kind, name, ...extra });
    blockCache?.set(name, { id: b.id.block, kind });
    return b.id.block;
  } catch (e) {
    if (!e.message.includes('422')) throw e;
    // Block already exists (name conflict) but wasn't in the initial cache.
    // Re-fetch with a high limit to locate it.
    const { items } = await api('GET', `/blocks/${PROJECT}?kind=${kind}&limit=500`);
    const found = (items || []).find(b => b.name === name);
    if (!found) throw new Error(`findOrCreate: 422 but "${name}" not found in ${kind} list`);
    blockCache?.set(name, { id: found.id.block, kind });
    return found.id.block;
  }
}

async function pushReplaceStep(blockId, draftId, pmJson) {
  const draft = await api('GET', `/drafts/${PROJECT}/${blockId}/${draftId}`);
  const state = server.getEditorState('full', draft.data?.content, 0);
  const step = {
    stepType: 'replace',
    from: 0,
    to: state.doc.content.size,
    slice: { content: pmJson.content },
  };
  await api('POST', `/drafts/${PROJECT}/${blockId}/${draftId}/steps`, {
    client: 42,
    version: draft.next_step,
    steps: [step],
  });
}

// Create or reuse a named Content block, push pmJson as a new version.
// Returns {blockId, version, editableDraft} for use in Article composition.
// Throws on non-500 errors; on 500 (server-side rejection) logs PM size and rethrows.
async function pushContent(name, pmJson) {
  const blockId = await findOrCreate('Content', name);
  const draft = await api('POST', `/drafts/${PROJECT}/${blockId}`, { kind: 'Content' });
  try {
    await pushReplaceStep(blockId, draft.id.draft, pmJson);
  } catch (e) {
    const sz = JSON.stringify(pmJson).length;
    console.error(`  PM JSON size: ${sz} chars`);
    throw e;
  }
  await api('POST', `/drafts/${PROJECT}/${blockId}/${draft.id.draft}/merge`, { version: 0 });
  const block = await api('GET', `/blocks/${PROJECT}/${blockId}`);
  const editable = await api('POST', `/drafts/${PROJECT}/${blockId}`, { kind: 'Content' });
  return { blockId, version: block.latest_version, editableDraft: editable.id.draft };
}

// Normalize a bib key to a valid Curvenote block name.
// Pattern: /^[a-z0-9]{1}[a-z0-9-]{1,48}[a-z0-9]{1}$/ (3-50 chars).
function bibKeyToName(key) {
  const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 44);
  return `ref-${slug || 'unknown'}`;
}

// Find-or-create a Reference block for a bib key. Returns "oxa:PROJECT/BLOCK".
// Uses the original key as the block title for human readability.
async function pushRef(key) {
  const name = bibKeyToName(key);
  const blockId = await findOrCreate('Reference', name, { title: key });
  return `oxa:${PROJECT}/${blockId}`;
}

async function deleteOthers(kind, keep) {
  const { items } = await api('GET', `/blocks/${PROJECT}?kind=${kind}&limit=500`);
  const targets = (items || []).filter(b => !keep.has(b.id.block));
  if (!targets.length) { console.log(`  ${kind}: nothing to delete`); return; }
  let ok = 0;
  for (const b of targets) {
    try { await api('DELETE', `/blocks/${PROJECT}/${b.id.block}`); ok++; } catch (e) {
      console.warn(`  ! delete ${kind} ${b.id.block}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  ${kind}: deleted ${ok}/${targets.length}`);
}

// ── main ──────────────────────────────────────────────────────────────────────

// Assemble all entries upfront so we can collect bib keys before any network calls.
console.log(`\nTOC: ${TOC.length} top-level entries → ${TOC.length} Articles`);
const entries = TOC.map((entry, i) => {
  const { title, markdown } = assembleEntry(entry);
  const sanitized = sanitize(markdown);
  const atoms = chunkProse(parseBlocks(sanitized));
  return { entry, title, sanitized, atoms, artIdx: i + 1 };
});

const allMarkdown = entries.map(e => e.sanitized).join('\n');
const keys = bibKeys(allMarkdown);
console.log(`  cite keys: ${keys.length}`);

if (DRY_RUN || LINT) {
  if (DRY_RUN) {
    console.log('\n--dry-run — per-article atom counts:');
    for (const { title, atoms, artIdx } of entries) {
      const tc = atoms.reduce((a, { type }) => ({ ...a, [type]: (a[type] || 0) + 1 }), {});
      console.log(`  [${String(artIdx).padStart(2, '0')}] "${title}" — prose=${tc.prose ?? 0} table=${tc.table ?? 0} iframe=${tc.iframe ?? 0} figure=${tc.figure ?? 0}`);
    }
    const dumpPath = '/tmp/candidacy-v2-sanitized.md';
    await Bun.write(dumpPath, allMarkdown);
    console.log(`\nFull sanitized body → ${dumpPath}`);
  }
  const issues = lintEntries(entries);
  if (issues.length) {
    console.error(`\nLint: ${issues.length} unwrapped directive(s) — add +++ {"type":"..."} wrapper:`);
    for (const issue of issues) console.error(issue);
    process.exit(1);
  }
  console.log('\nLint: OK');
  if (DRY_RUN) process.exit(0);
  process.exit(0);
}

// ── auth ──────────────────────────────────────────────────────────────────────

console.log('\nAuthenticating...');
const session = await fetch(`${API}/login`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}` },
}).then(r => r.json()).then(j => j.session);
if (!session) die('Failed to obtain session JWT from /login.');
HDR = { Authorization: `Bearer ${session}`, 'Content-Type': 'application/json', 'X-ClientName': 'kd-gat-buildv2' };

console.log('\nLoading block cache...');
await loadBlockCache();

// ── references ────────────────────────────────────────────────────────────────

console.log(`\nUpserting ${keys.length} Reference blocks...`);
let refCreated = 0, refReused = 0;
for (const key of keys) {
  const wasInCache = blockCache.has(bibKeyToName(key));
  await pushRef(key);
  if (wasInCache) refReused++; else refCreated++;
}
console.log(`  References: ${refCreated} created, ${refReused} reused`);

// ── per-section Articles ───────────────────────────────────────────────────────

const keepArticles = new Set();
const keepContent = new Set();
let totalContentBlocks = 0;

for (const { title, atoms, artIdx } of entries) {
  const artName = `cand-${String(artIdx).padStart(2, '0')}`;
  const tc = atoms.reduce((a, { type }) => ({ ...a, [type]: (a[type] || 0) + 1 }), {});
  console.log(`\n── Article ${artIdx}/${entries.length}: "${title}" ──`);
  console.log(`   atoms: prose=${tc.prose ?? 0} table=${tc.table ?? 0} iframe=${tc.iframe ?? 0} figure=${tc.figure ?? 0}`);

  const articleId = await findOrCreate('Article', artName, { title });
  keepArticles.add(articleId);

  const atomRefs = [];
  const typeCounters = {};
  for (const atom of atoms) {
    const n = typeCounters[atom.type] ?? 0;
    typeCounters[atom.type] = n + 1;
    const name = atomName(artIdx, atom.type, n);
    let pmJson;
    switch (atom.type) {
      case 'table':  pmJson = gfmTableToPM(atom.content); break;
      case 'iframe': pmJson = iframeToPM(atom.content);   break;
      case 'figure': pmJson = figureToPM(atom.content);   break;
      default:       pmJson = proseToPM(atom.content); break;
    }
    if (!pmJson) {
      console.warn(`   ! skipping ${name}: ${atom.content.slice(0, 60).replace(/\n/g, '↵')}`);
      continue;
    }
    const pmSz = JSON.stringify(pmJson).length;
    process.stdout.write(`   [${atom.type}] ${name} (${pmSz}b) → `);
    try {
      const ref = await pushContent(name, pmJson);
      atomRefs.push(ref);
      keepContent.add(ref.blockId);
      console.log(`${ref.blockId} v${ref.version}`);
    } catch (e) {
      console.error(`FAILED: ${e.message.slice(0, 120)}`);
      console.error(`   content: ${atom.content.slice(0, 120).replace(/\n/g, '↵')}`);
    }
  }
  totalContentBlocks += atomRefs.length;

  // Publish Article version with all atom children in order.
  const order = [];
  const childrenPublished = {};
  const childrenDraft = {};
  for (const ref of atomRefs) {
    const cid = `${ref.blockId}-${ref.version}`;
    order.push(cid);
    childrenPublished[cid] = { id: cid, src: { project: PROJECT, block: ref.blockId, version: ref.version, draft: null }, style: null };
    childrenDraft[cid] = { id: cid, src: { project: PROJECT, block: ref.blockId, version: ref.version, draft: ref.editableDraft }, style: null };
  }
  await api('POST', `/blocks/${PROJECT}/${articleId}/versions`, { order, children: childrenPublished });
  const published = await api('GET', `/blocks/${PROJECT}/${articleId}`);
  console.log(`   Article v${published.latest_version}, ${order.length} children`);

  // Article draft must be created AFTER a published version exists; otherwise
  // parent=null and the editor refuses to render it.
  const aDraft = await api('POST', `/drafts/${PROJECT}/${articleId}`, { kind: 'Article', data: { children: {} } });
  await api('PATCH', `/blocks/${PROJECT}/${articleId}`, { default_draft: aDraft.id.draft });
  await api('PATCH', `/drafts/${PROJECT}/${articleId}/${aDraft.id.draft}`, { data: { children: childrenDraft } });
  console.log(`   Article draft ${aDraft.id.draft} bound`);
}

// ── cleanup ────────────────────────────────────────────────────────────────────

console.log('\nCleaning up stale blocks...');
await deleteOthers('Article', keepArticles);
await deleteOthers('Content', keepContent);

console.log('\nDone.');
console.log(`  Project:  ${PROJECT}`);
console.log(`  Articles: ${entries.length} (one per TOC section)`);
console.log(`  Content:  ${totalContentBlocks} blocks`);
