// vite.config.ts
import { defineConfig } from "file:///D:/Projects/1AOrganized/NodeJsProjects/Musoftwares.com/AppBuilder/packages/webui/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Projects/1AOrganized/NodeJsProjects/Musoftwares.com/AppBuilder/node_modules/@vitejs/plugin-react/dist/index.js";
import dts from "file:///D:/Projects/1AOrganized/NodeJsProjects/Musoftwares.com/AppBuilder/packages/webui/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "D:\\Projects\\1AOrganized\\NodeJsProjects\\Musoftwares.com\\AppBuilder\\packages\\webui";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      outDir: "dist",
      rollupTypes: true,
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "QwenCodeWebUI",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => {
        if (format === "es") return "index.js";
        if (format === "cjs") return "index.cjs";
        if (format === "umd") return "index.umd.js";
        return "index.js";
      }
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime"
        },
        assetFileNames: "styles.[ext]"
      }
    },
    sourcemap: true,
    minify: false,
    cssCodeSplit: false
  }
});
export {
  vite_config_default as default
};
/**
* @license
* Copyright 2025 Qwen Team
* SPDX-License-Identifier: Apache-2.0
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0c1xcXFwxQU9yZ2FuaXplZFxcXFxOb2RlSnNQcm9qZWN0c1xcXFxNdXNvZnR3YXJlcy5jb21cXFxcQXBwQnVpbGRlclxcXFxwYWNrYWdlc1xcXFx3ZWJ1aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUHJvamVjdHNcXFxcMUFPcmdhbml6ZWRcXFxcTm9kZUpzUHJvamVjdHNcXFxcTXVzb2Z0d2FyZXMuY29tXFxcXEFwcEJ1aWxkZXJcXFxccGFja2FnZXNcXFxcd2VidWlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1Byb2plY3RzLzFBT3JnYW5pemVkL05vZGVKc1Byb2plY3RzL011c29mdHdhcmVzLmNvbS9BcHBCdWlsZGVyL3BhY2thZ2VzL3dlYnVpL3ZpdGUuY29uZmlnLnRzXCI7LyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMjUgUXdlbiBUZWFtXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuICovXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuLyoqXG4gKiBWaXRlIGNvbmZpZ3VyYXRpb24gZm9yIEBxd2VuLWNvZGUvd2VidWkgbGlicmFyeVxuICpcbiAqIEJ1aWxkIG91dHB1dHM6XG4gKiAtIEVTTTogZGlzdC9pbmRleC5qcyAocHJpbWFyeSBmb3JtYXQpXG4gKiAtIENKUzogZGlzdC9pbmRleC5janMgKGNvbXBhdGliaWxpdHkpXG4gKiAtIFVNRDogZGlzdC9pbmRleC51bWQuanMgKGZvciBDRE4gdXNhZ2UpXG4gKiAtIFR5cGVTY3JpcHQgZGVjbGFyYXRpb25zOiBkaXN0L2luZGV4LmQudHNcbiAqIC0gQ1NTOiBkaXN0L3N0eWxlcy5jc3MgKG9wdGlvbmFsIHN0eWxlcylcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgZHRzKHtcbiAgICAgIGluY2x1ZGU6IFsnc3JjJ10sXG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIHJvbGx1cFR5cGVzOiB0cnVlLFxuICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC50cycpLFxuICAgICAgbmFtZTogJ1F3ZW5Db2RlV2ViVUknLFxuICAgICAgZm9ybWF0czogWydlcycsICdjanMnLCAndW1kJ10sXG4gICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4ge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZXMnKSByZXR1cm4gJ2luZGV4LmpzJztcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2NqcycpIHJldHVybiAnaW5kZXguY2pzJztcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ3VtZCcpIHJldHVybiAnaW5kZXgudW1kLmpzJztcbiAgICAgICAgcmV0dXJuICdpbmRleC5qcyc7XG4gICAgICB9LFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0L2pzeC1ydW50aW1lJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHJlYWN0OiAnUmVhY3QnLFxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxuICAgICAgICAgICdyZWFjdC9qc3gtcnVudGltZSc6ICdSZWFjdEpTWFJ1bnRpbWUnLFxuICAgICAgICB9LFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ3N0eWxlcy5bZXh0XScsXG4gICAgICB9LFxuICAgIH0sXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQU1BLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFNBQVM7QUFDaEIsU0FBUyxlQUFlO0FBVHhCLElBQU0sbUNBQW1DO0FBcUJ6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixTQUFTLENBQUMsS0FBSztBQUFBLE1BQ2YsUUFBUTtBQUFBLE1BQ1IsYUFBYTtBQUFBLE1BQ2Isa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDeEMsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLE1BQU0sT0FBTyxLQUFLO0FBQUEsTUFDNUIsVUFBVSxDQUFDLFdBQVc7QUFDcEIsWUFBSSxXQUFXLEtBQU0sUUFBTztBQUM1QixZQUFJLFdBQVcsTUFBTyxRQUFPO0FBQzdCLFlBQUksV0FBVyxNQUFPLFFBQU87QUFDN0IsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsU0FBUyxhQUFhLG1CQUFtQjtBQUFBLE1BQ3BELFFBQVE7QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQLE9BQU87QUFBQSxVQUNQLGFBQWE7QUFBQSxVQUNiLHFCQUFxQjtBQUFBLFFBQ3ZCO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxFQUNoQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
