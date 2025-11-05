import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    solidPlugin(),
    dts({
      outputDir: 'dist',
      tsConfigFilePath: './tsconfig.json',
      insertTypesEntry: true,
    })
  ],
  build: {
    cssTarget: 'chrome61',
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'klinechartspro',
      fileName: (format) => {
        if (format === 'es') {
          return 'klinecharts-pro.js';
        }
        if (format === 'umd') {
          return 'klinecharts-pro.umd.js';
        }
        return `klinecharts-pro.${format}.js`;
      }
    },
    rollupOptions: {
      external: ['@klinecharts/core', 'solid-js'],
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'style.css') {
            return 'klinecharts-pro.css';
          }
          return chunkInfo.name ?? 'assets';
        },
        globals: {
          '@klinecharts/core': 'klinecharts',
          'solid-js': 'Solid'
        },
      },
    },
  }
});