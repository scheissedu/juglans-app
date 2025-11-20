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
      proxy: {
        '/api-kalshi': {
          target: 'https://api.elections.kalshi.com/trade-api/v2',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-kalshi/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // console.log(`[Vite Proxy] Forwarding: ${req.method} ${req.url} -> ${options.target}${proxyReq.path}`);
            });
            proxy.on('error', (err, req, res) => {
              console.error('[Vite Proxy] Error:', err);
            });
          },
        },
        '/api/v1/finance': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // console.log(`[Vite Proxy] Forwarding to Finance API: ${req.method} ${req.url}`);
            });
          },
        },
      },
      // --- 核心修改：CSP 允许加载多个图片源 ---
      headers: { 
        'Content-Security-Policy': 
          "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
          "img-src 'self' data: https://cdn.jsdelivr.net https://raw.githubusercontent.com https://financialmodelingprep.com *;" 
      }
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