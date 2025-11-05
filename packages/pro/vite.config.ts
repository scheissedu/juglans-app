import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import dts from 'vite-plugin-dts';
import path from 'path';

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
        // Ensure other formats also have a name
        return `klinecharts-pro.${format}.js`;
      }
    },
    rollupOptions: {
      external: ['klinecharts', 'solid-js'],
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'style.css') {
            return 'klinecharts-pro.css';
          }
          // Provide a fallback name for other assets
          return chunkInfo.name ?? 'assets';
        },
        globals: {
          klinecharts: 'klinecharts',
          'solid-js': 'Solid'
        },
      },
    },
  }
});