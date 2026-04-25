#!/usr/bin/env node
/**
 * Build each figure as a separate vite invocation.
 * vite-plugin-singlefile requires inlineDynamicImports which is
 * incompatible with multiple rollup entry points in a single pass.
 *
 * index.html and main.js are generated from templates if not present,
 * so each figure only needs an App.svelte (and optional data.json).
 */
import { readdirSync, existsSync, renameSync, rmSync, writeFileSync, statSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const srcDir = resolve(import.meta.dirname, "src/figures");
const outDir = resolve(import.meta.dirname, "..", "_build", "figures");

// Figures live under src/figures/{data,diagrams}/<name>/. Output names stay
// flat (_build/figures/<name>.html) so iframe URLs in MyST/TMLR are unchanged.
const CATEGORIES = ["data", "diagrams"];

function discoverFigures() {
  const found = [];
  for (const category of CATEGORIES) {
    const catDir = resolve(srcDir, category);
    if (!existsSync(catDir)) continue;
    for (const d of readdirSync(catDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const figDir = resolve(catDir, d.name);
      if (!existsSync(resolve(figDir, "App.svelte"))) continue;
      found.push({ name: d.name, category, dir: figDir });
    }
  }
  return found;
}

// FIGURE=name → build only that figure. FORCE=1 → ignore mtime gate.
const figureFilter = process.env.FIGURE || "";
const force = process.env.FORCE === "1";

// Recursively find max mtime across files/dirs (used for incremental gating).
function maxMtime(paths) {
  let max = 0;
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        max = Math.max(max, maxMtime([resolve(p, e.name)]));
      }
    } else {
      max = Math.max(max, st.mtimeMs);
    }
  }
  return max;
}

// Shared dependency surface: a change here invalidates every figure.
const sharedMtime = maxMtime([
  resolve(import.meta.dirname, "src/lib"),
  resolve(import.meta.dirname, "vite.config.js"),
  resolve(import.meta.dirname, "package.json"),
  resolve(import.meta.dirname, "..", "styles.yml"),
]);

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

const figures = discoverFigures();

const filtered = figureFilter
  ? figures.filter((f) => f.name === figureFilter)
  : figures;
if (figureFilter && filtered.length === 0) {
  console.error(`ERROR: figure '${figureFilter}' not found under ${srcDir}/{data,diagrams}/`);
  console.error(`Available: ${figures.map((f) => f.name).join(", ")}`);
  process.exit(1);
}

console.log(
  `Building ${filtered.length} figure(s): ${filtered.map((f) => `${f.category}/${f.name}`).join(", ")}${force ? " [FORCE]" : ""}`,
);

// Remove stale outputs from figures no longer in src/ (only when building all).
if (existsSync(outDir) && !figureFilter) {
  const figSet = new Set(figures.map((f) => f.name));
  for (const f of readdirSync(outDir)) {
    if (f.endsWith(".html") && f !== "index.html" && !figSet.has(f.replace(/\.html$/, ""))) {
      console.log(`  removing stale output: ${f}`);
      rmSync(resolve(outDir, f), { force: true });
    }
  }
}

const passed = [];
const failed = [];
const skipped = [];

for (const { name, category, dir: figDir } of filtered) {
  const outFile = resolve(outDir, `${name}.html`);

  // Incremental skip: existing output newer than figure dir + shared deps.
  if (!force && existsSync(outFile)) {
    const figMtime = maxMtime([figDir]);
    const outMtime = statSync(outFile).mtimeMs;
    if (outMtime > Math.max(figMtime, sharedMtime)) {
      console.log(`  skip: ${category}/${name} (up to date)`);
      skipped.push(name);
      passed.push(name);
      continue;
    }
  }

  ensureIndexHtml(figDir, name);
  ensureMainJs(figDir, name);

  // Remove stale output so the new build isn't merged with old content
  rmSync(outFile, { force: true });

  console.log(`  ${category}/${name}...`);
  try {
    execSync(`npx vite build`, {
      cwd: import.meta.dirname,
      env: { ...process.env, FIGURE: name, FIGURE_CATEGORY: category },
      stdio: "inherit",
    });
    // Vite outputs to outDir/src/figures/<category>/<name>/index.html — rename to outDir/<name>.html
    const nestedHtml = resolve(outDir, "src", "figures", category, name, "index.html");
    const rootIndexHtml = resolve(outDir, "index.html");
    const outputHtml = existsSync(nestedHtml) ? nestedHtml : existsSync(rootIndexHtml) ? rootIndexHtml : null;
    if (outputHtml) {
      renameSync(outputHtml, resolve(outDir, `${name}.html`));
      passed.push(name);
    } else {
      console.error(`  ERROR: ${name} — vite produced no output`);
      failed.push(name);
    }
  } catch (err) {
    console.error(`  ERROR: ${name} — build failed: ${err.message}`);
    failed.push(name);
  }
}

// Clean up stray files from the nested output path
rmSync(resolve(outDir, "index.html"), { force: true });
rmSync(resolve(outDir, "src"), { recursive: true, force: true });

// Summary
console.log(
  `\nBuild complete: ${passed.length - skipped.length} built, ${skipped.length} skipped, ${failed.length} failed`,
);
if (failed.length > 0) {
  console.error(`Failed figures: ${failed.join(", ")}`);
  process.exit(1);
}
