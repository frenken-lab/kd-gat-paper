#!/usr/bin/env bun
// Distill layout preview server. Watches _build/site/content/*.json,
// re-runs the TMLR serializer on change, serves the result through a
// stripped Distill shell at http://localhost:4002.
//
// Goal: judge column fit, line length, figure sizing in ~2 s, instead of
// the 30 s `make tmlr` → Jekyll Docker round-trip. BibTeX is not resolved;
// d-cite renders as [key]. The Jekyll preview stays as the canonical
// pre-PR render — see GAPS.md Gap 2.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';
import { build } from './build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const SITE_CONTENT = join(ROOT, '_build', 'site', 'content');
const PREVIEW_OUT = join(ROOT, '_build', 'preview');
const FIGURES = join(ROOT, '_build', 'figures');
const KIT = join(ROOT, 'tmlr_do_not_modify', 'assets');
const SHELL = join(HERE, 'preview', 'index.html');
const PORT = Number(process.env.PORT || 4002);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

let buildVersion = 0;
const sseClients = new Set();

async function rebuild() {
  const t0 = Date.now();
  try {
    await build({ output: PREVIEW_OUT });
    buildVersion += 1;
    console.log(`[preview] rebuild ok in ${Date.now() - t0} ms (v${buildVersion})`);
    for (const res of sseClients) res.write(`data: ${buildVersion}\n\n`);
  } catch (err) {
    console.error(`[preview] rebuild failed: ${err.message}`);
  }
}

async function tryServeFile(res, path, mime) {
  if (!existsSync(path)) return false;
  const s = await stat(path);
  if (!s.isFile()) return false;
  res.writeHead(200, { 'content-type': mime || MIME[extname(path)] || 'application/octet-stream' });
  res.end(await readFile(path));
  return true;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = decodeURIComponent(url.pathname);

  if (path === '/sse') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    res.write(`data: ${buildVersion}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (path === '/' || path === '/index.html') {
    if (await tryServeFile(res, SHELL, MIME['.html'])) return;
  }

  if (path === '/submission.md') {
    const file = join(PREVIEW_OUT, 'submission.md');
    if (await tryServeFile(res, file, MIME['.md'])) return;
  }

  // Distill template + theme CSS straight from the kit.
  if (path === '/distillpub/template.v2.js') {
    if (await tryServeFile(res, join(KIT, 'js', 'distillpub', 'template.v2.js'))) return;
  }
  if (path === '/main.css') {
    if (await tryServeFile(res, join(KIT, 'css', 'main.css'))) return;
  }

  // Figures live in _build/figures; build.mjs writes paths like
  // assets/html/submission/<name>.html via Liquid relative_url. The
  // preview shell strips Liquid so iframes resolve here.
  if (path.startsWith('/assets/html/submission/')) {
    const file = join(FIGURES, path.slice('/assets/html/submission/'.length));
    if (await tryServeFile(res, file)) return;
  }
  if (path.startsWith('/assets/images/')) {
    const file = join(ROOT, 'images', path.slice('/assets/images/'.length));
    if (await tryServeFile(res, file)) return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end(`404: ${path}`);
}

async function main() {
  if (!existsSync(SITE_CONTENT)) {
    console.error(`[preview] ${SITE_CONTENT} not found. Run 'myst build --site' first.`);
    process.exit(1);
  }
  await rebuild();

  const watcher = chokidar.watch(`${SITE_CONTENT}/*.json`, { ignoreInitial: true });
  let pending = null;
  const schedule = () => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => { pending = null; rebuild(); }, 150);
  };
  watcher.on('add', schedule).on('change', schedule).on('unlink', schedule);

  const server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(`[preview] ${req.url} → ${err.message}`);
      if (!res.headersSent) res.writeHead(500);
      res.end(err.message);
    });
  });
  server.listen(PORT, () => {
    console.log(`[preview] http://localhost:${PORT}  (watching ${SITE_CONTENT})`);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
