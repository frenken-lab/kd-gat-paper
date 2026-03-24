#!/usr/bin/env node
/**
 * Build each figure as a separate vite invocation.
 * vite-plugin-singlefile requires inlineDynamicImports which is
 * incompatible with multiple rollup entry points in a single pass.
 */
import { readdirSync, existsSync, renameSync, rmSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const srcDir = resolve(import.meta.dirname, "src");
const outDir = resolve(import.meta.dirname, "..", "figures");
const figures = readdirSync(srcDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(resolve(srcDir, d.name, "index.html")))
  .map(d => d.name);

console.log(`Building ${figures.length} figures: ${figures.join(", ")}`);

for (const fig of figures) {
  console.log(`  ${fig}...`);
  execSync(`npx vite build`, {
    cwd: import.meta.dirname,
    env: { ...process.env, FIGURE: fig },
    stdio: "inherit",
  });
  // Vite outputs figures/src/<name>/index.html — flatten to figures/<name>.html
  const nested = resolve(outDir, "src", fig, "index.html");
  if (existsSync(nested)) {
    renameSync(nested, resolve(outDir, `${fig}.html`));
  }
}

// Clean up empty nested dirs
rmSync(resolve(outDir, "src"), { recursive: true, force: true });

console.log("Done.");
