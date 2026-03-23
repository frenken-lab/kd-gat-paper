import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

// vite-plugin-singlefile requires a single entry point per build.
// FIGURE env var selects which figure to build; build.js iterates all.
const figure = process.env.FIGURE;
if (!figure) {
  throw new Error("Set FIGURE env var (e.g. FIGURE=umap vite build). Use `npm run build` to build all.");
}

export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    outDir: "../figures",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve("src", figure, "index.html"),
    },
  },
});
