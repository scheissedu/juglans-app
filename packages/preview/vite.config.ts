// /klinecharts-workspace/packages/preview/vite.config.ts

import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const prosemirrorPkgs = [
  'model',
  'state',
  'view',
  'commands',
  'schema-list',
  'transform',
  'keymap',
  'history',
  'dropcursor',
  'gapcursor',
];

const aliases = prosemirrorPkgs.flatMap(pkg => {
  const pkgName = `prosemirror-${pkg}`;
  const resolvedPath = require.resolve(pkgName);
  return [
    { find: pkgName, replacement: resolvedPath },
    { find: `@tiptap/pm/${pkg}`, replacement: resolvedPath }
  ];
});

export default defineConfig({
  plugins: [
    solidPlugin(),
  ],

  resolve: {
    alias: aliases,
    dedupe: [
      'solid-js', 
      'solid-js/web',
      '@tiptap/core',
      'tiptap-solid',
      ...prosemirrorPkgs.map(pkg => `prosemirror-${pkg}`)
    ],
  },

  optimizeDeps: {
    exclude: ['@klinecharts/core', '@klinecharts/pro'],
    include: [
      'solid-js', 
      'solid-js/web',
      '@tiptap/core',
      '@tiptap/pm',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder',
      'tiptap-solid',
      ...prosemirrorPkgs.map(pkg => `prosemirror-${pkg}`)
    ],
  },
  
  ssr: {
    noExternal: ['@klinecharts/pro'],
  },

  server: {
    fs: {
      allow: ['../..'],
    },
    // +++ START: ADDED PROXY CONFIGURATION +++
    proxy: {
      // 将所有 /api 开头的请求代理到后端服务
      '/api': {
        target: 'http://localhost:3001', // 后端服务的地址
        changeOrigin: true, // 必须设置为 true
        // 如果需要，可以重写路径，但在这里我们不需要
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
    // +++ END: ADDED PROXY CONFIGURATION +++
  },
});