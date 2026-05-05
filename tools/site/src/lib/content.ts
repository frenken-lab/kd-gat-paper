// Reads MyST's site build output. `myst build --site` produces
// _build/site/config.json (TOC + project meta) and one
// _build/site/content/<slug>.json per page (each with frontmatter + mdast).
//
// This module gives the catch-all Astro route a list of pages to emit
// and pulls the AST for each one.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..', '..', '..', '..', '_build', 'site');
const CONTENT_DIR = join(SITE, 'content');
const CONFIG_PATH = join(SITE, 'config.json');

export interface SiteConfig {
  projects: Array<{
    title?: string;
    toc?: TocEntry[];
    [k: string]: unknown;
  }>;
  [k: string]: unknown;
}

export interface TocEntry {
  title?: string;
  file?: string;
  url?: string;
  children?: TocEntry[];
}

export interface Page {
  slug: string;
  frontmatter: Record<string, unknown>;
  mdast: MystNode;
}

export interface MystNode {
  type: string;
  value?: string;
  children?: MystNode[];
  [k: string]: unknown;
}

export function loadConfig(): SiteConfig {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(
      `Site config not found at ${CONFIG_PATH}. Run \`myst build --site --config myst.candidacy.yml\` first.`
    );
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as SiteConfig;
}

export function loadAllPages(): Page[] {
  if (!existsSync(CONTENT_DIR)) {
    throw new Error(`Content directory not found at ${CONTENT_DIR}.`);
  }
  const out: Page[] = [];
  for (const f of readdirSync(CONTENT_DIR)) {
    if (!f.endsWith('.json')) continue;
    const slug = basename(f, '.json');
    const data = JSON.parse(readFileSync(join(CONTENT_DIR, f), 'utf8'));
    let mdast = data.mdast;
    if (typeof mdast === 'string') mdast = JSON.parse(mdast);
    if (!mdast) continue;
    out.push({
      slug,
      frontmatter: data.frontmatter ?? {},
      mdast,
    });
  }
  return out;
}
