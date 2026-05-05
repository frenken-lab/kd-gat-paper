import { defineConfig } from 'astro/config';

// MyST emits _build/site/{config.json,content/*.json} via `myst build --site`.
// We read those at build time and render to flat HTML in _build/astro/.
export default defineConfig({
  output: 'static',
  outDir: '../../_build/astro',
  publicDir: '../../_build/site/public',
  trailingSlash: 'never',
});
