import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    fs: {
      allow: ['../..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    headers: {
      // 核心修正：将 img-src 设置为 * 以允许所有来源
      'Content-Security-Policy': "img-src 'self' data: https://cdn.jsdelivr.net *;"
    }
  },

  resolve: {
    alias: {
      '@klinecharts/light': path.resolve(__dirname, '../light/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  optimizeDeps: {
    exclude: ['@klinecharts/core', '@klinecharts/pro', '@klinecharts/light'],
  },
});