import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Virtual module that exposes styles.yml at build time
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
        // Palette colors
        ...Object.entries(palette).map(([k, v]) => `  --color-${k}: ${v};`),
        // Fill colors
        ...Object.entries(fills).map(([k, v]) => `  --fill-${k}: ${v};`),
        // Fonts
        ...Object.entries(fonts).map(([k, v]) => `  --font-${k}: ${v};`),
        // Utilities
        ...Object.entries(utility).map(([k, v]) => `  --utility-${k}: ${v};`),
      ];
      return `:root {\n${vars.join("\n")}\n}`;
    }
  },
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const figure = env.FIGURE;

  const isServe = command === "serve";

  if (isServe) {
    if (!figure) {
      throw new Error(
        "Figures can only be served one at a time. Set the FIGURE env var (e.g. FIGURE=umap) and try again.",
      );
    } else {
      console.log(`Serving ${figure} figure`);
    }
  }

  return {
    plugins: [
      stylesVirtualPlugin,
      svelte(),
      ...(isServe ? [] : [viteSingleFile()]),
    ],
    root: figure ? resolve(__dirname, "src", "figures", figure) : __dirname,
    build: {
      outDir: resolve(__dirname, "../_figures"),
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, "src", "figures", figure, "index.html"),
      },
    },
  };
});
