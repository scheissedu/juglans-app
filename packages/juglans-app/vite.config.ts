import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  // In dev, alias to src. In prod, let pnpm/node resolve to dist.
  const aliases = !isProduction ? {
    '@klinecharts/core': path.resolve(__dirname, '../core/src/index.ts'),
    '@klinecharts/pro': path.resolve(__dirname, '../pro/src/index.ts'),
    '@klinecharts/light': path.resolve(__dirname, '../light/src/index.tsx'),
  } : {};

  return {
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
        'Content-Security-Policy': "img-src 'self' data: https://cdn.jsdelivr.net *;"
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