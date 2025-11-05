import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    cssTarget: 'chrome61',
    sourcemap: true,
    rollupOptions: {
      external: ['klinecharts'],
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'style.css') {
            return 'klinecharts-light.css'
          }
          return chunkInfo.name ?? 'assets'
        },
        globals: {
          klinecharts: 'klinecharts'
        },
      },
    },
    lib: {
      entry: './src/index.tsx',
      name: 'klinechartslight',
      fileName: (format) => {
        if (format === 'es') {
          return 'klinecharts-light.js'
        }
        if (format === 'umd') {
          return 'klinecharts-light.umd.js'
        }
        return `klinecharts-light.${format}.js`
      }
    }
  }
})