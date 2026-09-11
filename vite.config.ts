import { defineConfig } from 'vite';

// Uncommon port so the dev server does not collide with other tools.
const PORT = 47321;

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the game at /Basiliska/; local/dev stays at /.
  base: process.env.VITE_BASE || (mode === 'production' ? '/Basiliska/' : '/'),
  root: '.',
  publicDir: 'public',
  server: { host: '127.0.0.1', port: PORT, strictPort: true },
  preview: { host: '127.0.0.1', port: PORT, strictPort: true },
  build: { target: 'es2022', outDir: 'dist' },
}));
