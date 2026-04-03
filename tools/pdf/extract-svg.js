#!/usr/bin/env node
/**
 * Extract static SVG from built SveltePlot figures.
 *
 * Loads each _build/figures/*.html in headless Chromium, waits for the
 * SveltePlot <svg> to render, inlines computed styles, and writes a
 * standalone SVG file to _build/figures/static/.
 *
 * Figures that render no SVG (stub figures showing "Awaiting rewrite")
 * are skipped with a warning.
 *
 * Usage:
 *   node tools/pdf/extract-svg.js              # all figures
 *   node tools/pdf/extract-svg.js umap cka     # specific figures
 */
import { chromium } from "playwright";
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const figuresDir = resolve(ROOT, "_build", "figures");
const outDir = resolve(figuresDir, "static");

if (!existsSync(figuresDir)) {
  console.error("ERROR: _build/figures/ not found. Run 'make figures' first.");
  process.exit(1);
}

// Filter to requested figures or all
const args = process.argv.slice(2);
const allFiles = readdirSync(figuresDir).filter((f) => f.endsWith(".html"));
const files = args.length
  ? args.map((name) => (name.endsWith(".html") ? name : `${name}.html`))
  : allFiles;

const missing = files.filter((f) => !allFiles.includes(f));
if (missing.length) {
  console.error(`ERROR: figures not found: ${missing.join(", ")}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

/** Find the latest installed Playwright chromium in the cache. */
function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;

  const cacheDir = join(process.env.HOME, ".cache", "ms-playwright");
  if (!existsSync(cacheDir)) return undefined; // let playwright try its default

  const dirs = readdirSync(cacheDir)
    .filter((d) => d.startsWith("chromium-"))
    .sort()
    .reverse();

  for (const dir of dirs) {
    const bin = join(cacheDir, dir, "chrome-linux64", "chrome");
    if (existsSync(bin)) return bin;
  }
  return undefined; // fall back to playwright default
}

console.log(`Extracting SVG from ${files.length} figure(s)...`);

const executablePath = findChromium();
const browser = await chromium.launch({ ...(executablePath && { executablePath }) });

const STYLE_PROPS = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "dominant-baseline",
  "paint-order",
];

let extracted = 0;

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  await page.goto(`file://${resolve(figuresDir, file)}`, { waitUntil: "networkidle" });

  // Wait for SveltePlot SVG or any SVG; skip if neither appears
  const el = await page
    .locator("figure.svelteplot svg, svg")
    .first()
    .waitFor({ state: "attached", timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (!el) {
    console.warn(`  SKIP: ${file} (no SVG rendered)`);
    await page.close();
    continue;
  }

  // Let layout settle (clientWidth binding, transitions)
  await page.waitForTimeout(500);

  const svg = await page.evaluate((props) => {
    const el =
      document.querySelector("figure.svelteplot svg") || document.querySelector("svg");
    if (!el) return null;

    // Inline computed styles so SVG is standalone (no Svelte scoped CSS)
    for (const node of el.querySelectorAll("*")) {
      const computed = getComputedStyle(node);
      for (const prop of props) {
        const val = computed.getPropertyValue(prop);
        if (val && !node.style.getPropertyValue(prop)) {
          node.style.setProperty(prop, val);
        }
      }
    }

    // Add xmlns if missing (required for standalone SVG files)
    if (!el.getAttribute("xmlns")) {
      el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    return new XMLSerializer().serializeToString(el);
  }, STYLE_PROPS);

  if (!svg) {
    console.warn(`  SKIP: ${file} (SVG element empty)`);
    await page.close();
    continue;
  }

  const name = file.replace(".html", ".svg");
  const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
  writeFileSync(resolve(outDir, name), header + svg);
  console.log(`  ${name}`);
  extracted++;
  await page.close();
}

await browser.close();
console.log(`Done: ${extracted}/${files.length} figures. Output: _build/figures/static/`);
