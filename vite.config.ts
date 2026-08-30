import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    assetsInlineLimit: 10000000, // Inline small assets
    chunkSizeWarningLimit: 2000
  },
  server: {
    port: 5173,
    host: true
  }
});
