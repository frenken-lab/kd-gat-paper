import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const yamlImportPlugin = {
  name: 'yaml-import',
  transform(code, id) {
    if (/\.ya?ml$/.test(id) && !id.includes('\0')) {
      return `export default ${JSON.stringify(yaml.load(code))};`;
    }
  },
};

const stylesVirtualPlugin = {
  name: 'styles-yaml',
  resolveId(id) {
    if (id === 'virtual:styles') return '\0virtual:styles';
    if (id === 'virtual:theme-vars.css') return '\0virtual:theme-vars.css';
  },
  load(id) {
    const raw = readFileSync(resolve(__dirname, '../styles.yml'), 'utf8');
    const styles = yaml.load(raw);

    if (id === '\0virtual:styles') {
      return `export default ${JSON.stringify(styles)};`;
    }

    if (id === '\0virtual:theme-vars.css') {
      const { palette, fills, fonts, utility } = styles;
      const vars = [
        ...Object.entries(palette).map(([k, v]) => `  --color-${k}: ${v};`),
        ...Object.entries(fills).map(([k, v]) => `  --fill-${k}: ${v};`),
        ...Object.entries(fonts).map(([k, v]) => `  --font-${k}: ${v};`),
        ...Object.entries(utility).map(([k, v]) => `  --utility-${k}: ${v};`),
      ];
      return `:root {\n${vars.join('\n')}\n}`;
    }
  },
};

export default defineConfig({
  plugins: [yamlImportPlugin, stylesVirtualPlugin, svelte()],
  root: __dirname,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/speceditor/widget.js'),
      formats: ['es'],
      fileName: () => 'widget.js',
    },
    outDir: resolve(__dirname, '../tools/speceditor/dist'),
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
});
