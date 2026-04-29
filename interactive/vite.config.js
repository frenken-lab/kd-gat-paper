import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, readdirSync } from "fs";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const figuresDir = resolve(__dirname, "src/figures");

// Figures live under src/figures/{data,diagrams}/<name>/. Build outputs stay
// flat (_build/figures/<name>.html), so name uniqueness across categories is
// required — enforced implicitly by the existing figure names.
const FIGURE_CATEGORIES = ["data", "diagrams"];

const figureEntries = FIGURE_CATEGORIES.flatMap((category) => {
  const catDir = resolve(figuresDir, category);
  try {
    return readdirSync(catDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, category }));
  } catch {
    return [];
  }
}).sort((a, b) => a.name.localeCompare(b.name));

const figures = figureEntries.map((f) => f.name);
const figureCategoryByName = Object.fromEntries(
  figureEntries.map((f) => [f.name, f.category]),
);

function figureSrcPath(name) {
  const category = figureCategoryByName[name];
  if (!category) return null;
  return resolve(figuresDir, category, name);
}

// ---------------------------------------------------------------------------
// Plugin: import .yaml/.yml files as parsed JS objects
// ---------------------------------------------------------------------------
const yamlImportPlugin = {
  name: "yaml-import",
  transform(code, id) {
    if (/\.ya?ml$/.test(id) && !id.includes("\0")) {
      return `export default ${JSON.stringify(yaml.load(code))};`;
    }
  },
};

// ---------------------------------------------------------------------------
// Plugin: expose styles.yml as virtual modules
//   import styles from "virtual:styles"       -> parsed JS object
//   import "virtual:theme-vars.css"           -> :root { --color-* ... }
// ---------------------------------------------------------------------------
const stylesVirtualPlugin = {
  name: "styles-yaml",
  resolveId(id) {
    if (id === "virtual:styles") return "\0virtual:styles";
    if (id === "virtual:theme-vars.css") return "\0virtual:theme-vars.css";
  },
  load(id) {
    const raw = readFileSync(resolve(__dirname, "../styles.yml"), "utf8");
    const styles = yaml.load(raw);

    if (id === "\0virtual:styles") {
      return `export default ${JSON.stringify(styles)};`;
    }

    if (id === "\0virtual:theme-vars.css") {
      const { palette, fills, fonts, utility } = styles;
      const vars = [
        ...Object.entries(palette).map(([k, v]) => `  --color-${k}: ${v};`),
        ...Object.entries(fills).map(([k, v]) => `  --fill-${k}: ${v};`),
        ...Object.entries(fonts).map(([k, v]) => `  --font-${k}: ${v};`),
        ...Object.entries(utility).map(([k, v]) => `  --utility-${k}: ${v};`),
      ];
      return `:root {\n${vars.join("\n")}\n}`;
    }
  },
};

// ---------------------------------------------------------------------------
// Plugin: dev shell served at / and /__dev__
//
// A stable outer page with a <select> + <iframe>. Switching figures sets
// iframe.src only — the outer page never navigates, so StackBlitz
// WebContainers don't crash the preview (MPA hard-nav tears down the WS
// connection; iframe.src swap does not).
// ---------------------------------------------------------------------------
const devShellPlugin = {
  name: "dev-shell",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split("?")[0];
      if (url !== "/" && url !== "/__dev__" && url !== "/__dev__/") return next();

      const firstFig = figures[0];
      const firstCat = figureCategoryByName[firstFig];
      const options = figures
        .map(
          (f) =>
            `<option value="/src/figures/${figureCategoryByName[f]}/${f}/">${f}</option>`,
        )
        .join("\n      ");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Figures</title>
  <style>
    *{box-sizing:border-box;margin:0}
    body{display:flex;flex-direction:column;height:100vh;background:#111}
    #bar{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#1a1a1a;border-bottom:1px solid #333;flex-shrink:0}
    #bar span{color:#888;font:12px/1 monospace}
    #bar select{font:12px/1 monospace;background:#222;color:#ddd;border:1px solid #444;border-radius:3px;padding:2px 6px;cursor:pointer}
    iframe{flex:1;border:none;width:100%;background:#fff}
  </style>
</head>
<body>
  <div id="bar">
    <span>figure</span>
    <select id="sel">
      ${options}
    </select>
  </div>
  <iframe id="frame" src="${firstFig ? `/src/figures/${firstCat}/${firstFig}/` : 'about:blank'}"></iframe>
  <script>
    document.getElementById('sel').addEventListener('change', e => {
      document.getElementById('frame').src = e.target.value;
    });
  </script>
</body>
</html>`);
    });
  },
};

// ---------------------------------------------------------------------------
// Plugin: stable /figures/<name>.html alias for the dev server
//
// The MyST paper hardcodes iframe URLs like "…/submission/umap.html". In dev
// mode the MyST plugin `dev-iframes.mjs` rewrites those to
// "http://localhost:5173/figures/<name>.html". This middleware maps that path
// to the Vite route for each figure (/src/figures/<name>/), so the URL shape
// matches production while HMR still works.
// ---------------------------------------------------------------------------
const figureAliasPlugin = {
  name: "figure-alias",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const m = req.url && req.url.match(/^\/figures\/([^/?#]+)\.html(\?.*)?$/);
      if (m) {
        const name = m[1];
        const qs = m[2] || "";
        const category = figureCategoryByName[name];
        if (category) {
          req.url = `/src/figures/${category}/${name}/${qs}`;
        }
      }
      next();
    });
  },
};

// ---------------------------------------------------------------------------
// Vite config
// ---------------------------------------------------------------------------
export default defineConfig(({ command }) => {
  const isServe = command === "serve";

  // When FIGURE env is set (by build.js), build only that figure.
  // vite-plugin-singlefile requires inlineDynamicImports = single entry point.
  const singleFig = process.env.FIGURE;

  // Single figure: string input -> output is index.html at outDir root.
  // All figures: object input -> used by dev server for multi-page routing.
  const rollupInput = singleFig
    ? resolve(figureSrcPath(singleFig) ?? figuresDir, "index.html")
    : Object.fromEntries(
        figures.map((f) => [f, resolve(figureSrcPath(f), "index.html")])
      );

  return {
    plugins: [
      yamlImportPlugin,
      stylesVirtualPlugin,
      svelte(),
      ...(isServe ? [devShellPlugin, figureAliasPlugin] : [viteSingleFile()]),
    ],
    root: __dirname,
    server: {
      open: "/",
      fs: {
        allow: [resolve(__dirname, "..")],
      },
    },
    build: {
      outDir: resolve(__dirname, "../_build/figures"),
      emptyOutDir: false,
      rollupOptions: {
        input: rollupInput,
      },
    },
  };
});
