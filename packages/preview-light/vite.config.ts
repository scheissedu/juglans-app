import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['../..'],
    },
  },
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling
    exclude: ['@klinecharts/core', '@klinecharts/light'],
  },
});