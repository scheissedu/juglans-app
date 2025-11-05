// packages/juglans-app/vite.config.ts
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  const aliases = !isProduction
    ? {
        '@klinecharts/core': path.resolve(__dirname, '../core/src'),
        '@klinecharts/pro': path.resolve(__dirname, '../pro/src'),
        '@klinecharts/light': path.resolve(__dirname, '../light/src'),
      }
    : {};

  return {
    plugins: [solidPlugin()],
    server: {
      fs: { allow: ['../..'] },
      // --- 核心修正：移除 proxy ---
      headers: { 'Content-Security-Policy': "img-src 'self' data: https://cdn.jsdelivr.net *;" }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...aliases
      },
    },
    optimizeDeps: {
      exclude: ['@klinecharts/core', '@klinecharts/pro', '@klinecharts/light'],
    },
  };
});