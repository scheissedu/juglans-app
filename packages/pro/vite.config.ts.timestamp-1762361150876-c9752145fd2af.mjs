// vite.config.ts
import { defineConfig } from "file:///Users/ops/Desktop/exchang_app/klinecharts-workspace/node_modules/.pnpm/vite@4.5.14_@types+node@20.19.23_less@4.4.2_terser@5.44.0/node_modules/vite/dist/node/index.js";
import solidPlugin from "file:///Users/ops/Desktop/exchang_app/klinecharts-workspace/node_modules/.pnpm/vite-plugin-solid@2.11.10_@testing-library+jest-dom@5.17.0_solid-js@1.9.9_vite@4.5.14_@_42337259dd1007f8d91cd4eabe85efaf/node_modules/vite-plugin-solid/dist/esm/index.mjs";
import dts from "file:///Users/ops/Desktop/exchang_app/klinecharts-workspace/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@20.19.23_rollup@4.52.5_typescript@4.9.5_vite@4.5.14_@_884d9ca692861827913629a1d9c29288/node_modules/vite-plugin-dts/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    solidPlugin(),
    dts({
      outputDir: "dist",
      tsConfigFilePath: "./tsconfig.json",
      insertTypesEntry: true
    })
  ],
  build: {
    cssTarget: "chrome61",
    sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: "klinechartspro",
      fileName: (format) => {
        if (format === "es") {
          return "klinecharts-pro.js";
        }
        if (format === "umd") {
          return "klinecharts-pro.umd.js";
        }
        return `klinecharts-pro.${format}.js`;
      }
    },
    rollupOptions: {
      external: ["klinecharts", "solid-js"],
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === "style.css") {
            return "klinecharts-pro.css";
          }
          return chunkInfo.name ?? "assets";
        },
        globals: {
          klinecharts: "klinecharts",
          "solid-js": "Solid"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvb3BzL0Rlc2t0b3AvZXhjaGFuZ19hcHAva2xpbmVjaGFydHMtd29ya3NwYWNlL3BhY2thZ2VzL3Byb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL29wcy9EZXNrdG9wL2V4Y2hhbmdfYXBwL2tsaW5lY2hhcnRzLXdvcmtzcGFjZS9wYWNrYWdlcy9wcm8vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL29wcy9EZXNrdG9wL2V4Y2hhbmdfYXBwL2tsaW5lY2hhcnRzLXdvcmtzcGFjZS9wYWNrYWdlcy9wcm8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBzb2xpZFBsdWdpbiBmcm9tICd2aXRlLXBsdWdpbi1zb2xpZCc7XG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHNvbGlkUGx1Z2luKCksXG4gICAgZHRzKHtcbiAgICAgIG91dHB1dERpcjogJ2Rpc3QnLFxuICAgICAgdHNDb25maWdGaWxlUGF0aDogJy4vdHNjb25maWcuanNvbicsXG4gICAgICBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLFxuICAgIH0pXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgY3NzVGFyZ2V0OiAnY2hyb21lNjEnLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiAnLi9zcmMvaW5kZXgudHMnLFxuICAgICAgbmFtZTogJ2tsaW5lY2hhcnRzcHJvJyxcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdlcycpIHtcbiAgICAgICAgICByZXR1cm4gJ2tsaW5lY2hhcnRzLXByby5qcyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ3VtZCcpIHtcbiAgICAgICAgICByZXR1cm4gJ2tsaW5lY2hhcnRzLXByby51bWQuanMnO1xuICAgICAgICB9XG4gICAgICAgIC8vIEVuc3VyZSBvdGhlciBmb3JtYXRzIGFsc28gaGF2ZSBhIG5hbWVcbiAgICAgICAgcmV0dXJuIGBrbGluZWNoYXJ0cy1wcm8uJHtmb3JtYXR9LmpzYDtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ2tsaW5lY2hhcnRzJywgJ3NvbGlkLWpzJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChjaHVua0luZm8pID0+IHtcbiAgICAgICAgICBpZiAoY2h1bmtJbmZvLm5hbWUgPT09ICdzdHlsZS5jc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2tsaW5lY2hhcnRzLXByby5jc3MnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBQcm92aWRlIGEgZmFsbGJhY2sgbmFtZSBmb3Igb3RoZXIgYXNzZXRzXG4gICAgICAgICAgcmV0dXJuIGNodW5rSW5mby5uYW1lID8/ICdhc3NldHMnO1xuICAgICAgICB9LFxuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAga2xpbmVjaGFydHM6ICdrbGluZWNoYXJ0cycsXG4gICAgICAgICAgJ3NvbGlkLWpzJzogJ1NvbGlkJ1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXFYLFNBQVMsb0JBQW9CO0FBQ2xaLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sU0FBUztBQUdoQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixJQUFJO0FBQUEsTUFDRixXQUFXO0FBQUEsTUFDWCxrQkFBa0I7QUFBQSxNQUNsQixrQkFBa0I7QUFBQSxJQUNwQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sVUFBVSxDQUFDLFdBQVc7QUFDcEIsWUFBSSxXQUFXLE1BQU07QUFDbkIsaUJBQU87QUFBQSxRQUNUO0FBQ0EsWUFBSSxXQUFXLE9BQU87QUFDcEIsaUJBQU87QUFBQSxRQUNUO0FBRUEsZUFBTyxtQkFBbUIsTUFBTTtBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLGVBQWUsVUFBVTtBQUFBLE1BQ3BDLFFBQVE7QUFBQSxRQUNOLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsY0FBSSxVQUFVLFNBQVMsYUFBYTtBQUNsQyxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxpQkFBTyxVQUFVLFFBQVE7QUFBQSxRQUMzQjtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsYUFBYTtBQUFBLFVBQ2IsWUFBWTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
