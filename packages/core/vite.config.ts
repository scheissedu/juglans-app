import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import replace from '@rollup/plugin-replace';
import { getVersion } from './scripts/utils.js';

const version = getVersion();

export default defineConfig(({ mode }) => ({
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        '__VERSION__': version,
        'process.env.NODE_ENV': JSON.stringify(mode)
      }
    }),
    dts({
      outputDir: 'dist',
      tsConfigFilePath: './tsconfig.json',
      insertTypesEntry: true,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'klinecharts',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'index.esm.js';
        if (format === 'cjs') return 'index.cjs';
        if (format === 'umd') {
          return mode === 'production' ? 'umd/klinecharts.min.js' : 'umd/klinecharts.js';
        }
        return 'index.js';
      },
    }
  },
}));