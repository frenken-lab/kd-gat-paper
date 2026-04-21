import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, readdirSync } from "fs";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const figuresDir = resolve(__dirname, "src/figures");

const figures = readdirSync(figuresDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

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
// Plugin: compact dropdown figure-switcher injected into every dev HTML page
//
// - One small button top-right showing the active figure name
// - Click to open dropdown, click away to close
// - Refresh stays on the current figure
// - Dev only — not present in production builds
// ---------------------------------------------------------------------------
const devNavPlugin = {
  name: "dev-nav",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const originalEnd = res.end.bind(res);

      res.end = function (chunk, ...args) {
        const isHtml =
          typeof chunk === "string" &&
          chunk.includes("</body>") &&
          !chunk.includes("data-dev-nav");

        if (!isHtml) return originalEnd(chunk, ...args);

        const match = req.url.match(/\/src\/figures\/([^/]+)/);
        const active = match ? match[1] : figures[0];

        const navHtml = `
<div data-dev-nav style="position:fixed;top:8px;right:8px;z-index:99999;font-family:monospace;font-size:11px;">
  <button
    onclick="var d=this.nextElementSibling;d.style.display=d.style.display==='none'?'block':'none'"
    style="cursor:pointer;padding:3px 8px;background:#fff;border:1px solid #ccc;border-radius:3px;font-family:monospace;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,0.1);"
  >${active} &#9662;</button>
  <div style="display:none;margin-top:2px;background:#fff;border:1px solid #ccc;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,0.12);overflow:hidden;">
    ${figures.map((f) => `<a
      href="/src/figures/${f}/"
      style="display:block;padding:4px 10px;text-decoration:none;color:${f === active ? "#000" : "#444"};background:${f === active ? "#f0f0f0" : "#fff"};font-weight:${f === active ? "bold" : "normal"};"
      onmouseover="this.style.background='#f0f0f0'"
      onmouseout="this.style.background='${f === active ? "#f0f0f0" : "#fff"}'"
    >${f}</a>`).join("")}
  </div>
</div>
<script>
  document.addEventListener("click", function(e) {
    if (!e.target.closest("[data-dev-nav]"))
      document.querySelector("[data-dev-nav] div").style.display = "none";
  });
</script>`;

        chunk = chunk.replace("</body>", navHtml + "\n</body>");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return originalEnd(chunk, ...args);
      };

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
    ? resolve(figuresDir, singleFig, "index.html")
    : Object.fromEntries(
        figures.map((f) => [f, resolve(figuresDir, f, "index.html")])
      );

  return {
    plugins: [
      yamlImportPlugin,
      stylesVirtualPlugin,
      svelte(),
      ...(isServe ? [devNavPlugin] : [viteSingleFile()]),
    ],
    root: __dirname,
    server: {
      open: `/src/figures/${figures[0]}/`,
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
