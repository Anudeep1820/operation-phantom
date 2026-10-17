import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 3000
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
});
