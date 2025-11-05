// packages/juglans-app/vite.config.ts (最终简洁且正确的版本)
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  // 开发别名指向 src 目录
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
      proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
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