import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readdirSync } from "fs";
import { resolve } from "path";

// Auto-discover figure entry points: src/*/index.html
const figureEntries = {};
import { existsSync } from "fs";
for (const dir of readdirSync("src", { withFileTypes: true })) {
  if (dir.isDirectory() && existsSync(resolve("src", dir.name, "index.html"))) {
    figureEntries[dir.name] = resolve("src", dir.name, "index.html");
  }
}

export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    outDir: "../figures",
    emptyOutDir: false,
    rollupOptions: {
      input: figureEntries,
    },
  },
});
