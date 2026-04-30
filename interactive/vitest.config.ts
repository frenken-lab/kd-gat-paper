import yaml from 'js-yaml';
import { defineConfig } from 'vitest/config';

const yamlPlugin = {
  name: 'yaml-import',
  transform(code: string, id: string) {
    if (/\.ya?ml$/.test(id) && !id.includes('\0')) {
      return `export default ${JSON.stringify(yaml.load(code))};`;
    }
  },
};

// Stub virtual modules that Vite plugins provide at build time but vitest
// can't resolve in pure Node. Returns minimal structures that satisfy
// palette.ts and DiagramCanvas.svelte without requiring a real styles.yml.
const virtualStubPlugin = {
  name: 'virtual-stubs',
  resolveId(id: string) {
    if (id === 'virtual:styles' || id === 'virtual:theme-vars.css') return `\0${id}`;
  },
  load(id: string) {
    if (id === '\0virtual:styles')
      return `export default { palette: {}, fills: {}, roles: {} };`;
    if (id === '\0virtual:theme-vars.css') return ``;
  },
};

export default defineConfig({
  plugins: [yamlPlugin, virtualStubPlugin],
  test: {
    include: ['src/**/__tests__/*.test.ts'],
  },
});
