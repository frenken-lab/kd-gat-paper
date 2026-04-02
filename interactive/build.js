#!/usr/bin/env node
/**
 * Build each figure as a separate vite invocation.
 * vite-plugin-singlefile requires inlineDynamicImports which is
 * incompatible with multiple rollup entry points in a single pass.
 *
 * index.html and main.js are generated from templates if not present,
 * so each figure only needs an App.svelte (and optional data.json).
 */
import { readdirSync, existsSync, renameSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const srcDir = resolve(import.meta.dirname, "src/figures");
const outDir = resolve(import.meta.dirname, "..", "_build", "figures");

/** Generate index.html for a figure if it doesn't already exist. */
function ensureIndexHtml(figDir, name) {
  const dest = resolve(figDir, "index.html");
  if (existsSync(dest)) return;
  // Derive a human-readable title from the directory name
  const title = name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  writeFileSync(
    dest,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`,
  );
  console.log(`  generated index.html for ${name}`);
}

/** Generate main.js for a figure if it doesn't already exist. */
function ensureMainJs(figDir, name) {
  const dest = resolve(figDir, "main.js");
  if (existsSync(dest)) return;
  writeFileSync(
    dest,
    `import { mount } from 'svelte';
import App from './App.svelte';
mount(App, { target: document.getElementById('app') });
`,
  );
  console.log(`  generated main.js for ${name}`);
}

const figures = readdirSync(srcDir, { withFileTypes: true })
  .filter(
    (d) => d.isDirectory() && existsSync(resolve(srcDir, d.name, "App.svelte")),
  )
  .map((d) => d.name);

console.log(`Building ${figures.length} figures: ${figures.join(", ")}`);

// Remove stale outputs from figures no longer in src/
if (existsSync(outDir)) {
  const figSet = new Set(figures);
  for (const f of readdirSync(outDir)) {
    if (f.endsWith(".html") && f !== "index.html" && !figSet.has(f.replace(/\.html$/, ""))) {
      console.log(`  removing stale output: ${f}`);
      rmSync(resolve(outDir, f), { force: true });
    }
  }
}

const passed = [];
const failed = [];

for (const fig of figures) {
  const figDir = resolve(srcDir, fig);
  ensureIndexHtml(figDir, fig);
  ensureMainJs(figDir, fig);

  // Remove stale output so the new build isn't merged with old content
  rmSync(resolve(outDir, `${fig}.html`), { force: true });

  console.log(`  ${fig}...`);
  try {
    execSync(`npx vite build`, {
      cwd: import.meta.dirname,
      env: { ...process.env, FIGURE: fig },
      stdio: "inherit",
    });
    // Vite writes to _figures/index.html (root-relative outDir) — rename to _figures/<name>.html
    const rootIndexHtml = resolve(outDir, "index.html");
    if (existsSync(rootIndexHtml)) {
      renameSync(rootIndexHtml, resolve(outDir, `${fig}.html`));
      passed.push(fig);
    } else {
      console.error(`  ERROR: ${fig} — vite produced no output (expected index.html)`);
      failed.push(fig);
    }
  } catch (err) {
    console.error(`  ERROR: ${fig} — build failed: ${err.message}`);
    failed.push(fig);
  }
}

// Clean up any stray root index.html
rmSync(resolve(outDir, "index.html"), { force: true });

// Summary
console.log(`\nBuild complete: ${passed.length} passed, ${failed.length} failed`);
if (failed.length > 0) {
  console.error(`Failed figures: ${failed.join(", ")}`);
  process.exit(1);
}
