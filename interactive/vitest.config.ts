import { defineConfig } from 'vitest/config';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

const yamlPlugin = {
  name: 'yaml-import',
  transform(code: string, id: string) {
    if (/\.ya?ml$/.test(id) && !id.includes('\0')) {
      return `export default ${JSON.stringify(yaml.load(code))};`;
    }
  },
};

export default defineConfig({
  plugins: [yamlPlugin],
  test: {
    include: ['src/**/__tests__/*.test.ts'],
  },
});
