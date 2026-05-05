#!/usr/bin/env bun
// Semantic-layer lint driver.
//
// Loads the pre-built mdast JSON from _build/site/content/*.json, runs each
// plugin against every page, and reports through vfile-reporter. Exits 1 if
// any message is fatal.
//
// Why not unified-engine? The engine's value is parser/stringifier
// orchestration over source files. Here the AST is already parsed JSON
// produced by `myst build --site`, so engine adds nothing. We instantiate
// vfile + run visitor plugins directly.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VFile } from 'vfile';
import { reporter } from 'vfile-reporter';

import noDanglingXrefs from './semantic/no-dangling-xrefs.mjs';
import citationsExist from './semantic/citations-exist.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE_CONTENT = join(ROOT, '_build', 'site', 'content');
const BIB_DIR = join(ROOT, 'paper', 'references');

async function loadPage(astPath) {
  const data = JSON.parse(await readFile(astPath, 'utf8'));
  let mdast = data.mdast;
  if (typeof mdast === 'string') mdast = JSON.parse(mdast);
  return mdast;
}

async function main() {
  if (!existsSync(SITE_CONTENT)) {
    console.error(`error: ${SITE_CONTENT} not found. Run 'make site' first.`);
    process.exit(2);
  }

  const pages = (await readdir(SITE_CONTENT))
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (!pages.length) {
    console.error(`error: no AST pages in ${SITE_CONTENT}`);
    process.exit(2);
  }

  const files = [];
  let fatal = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const isLast = i === pages.length - 1;
    const astPath = join(SITE_CONTENT, page);
    const tree = await loadPage(astPath);
    const file = new VFile({ path: astPath });

    if (!tree) {
      const m = file.message(`No 'mdast' key in ${page}`);
      m.fatal = true;
      files.push(file);
      fatal += 1;
      continue;
    }

    const plugins = [
      noDanglingXrefs(),
      citationsExist({ bibDir: BIB_DIR, isLastFile: isLast }),
    ];
    for (const plugin of plugins) plugin(tree, file);

    fatal += file.messages.filter((m) => m.fatal).length;
    files.push(file);
  }

  process.stderr.write(reporter(files, { quiet: false }) + '\n');
  process.exit(fatal > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
