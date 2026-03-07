// vite.config.js
import { defineConfig } from "file:///C:/Users/rahul/OneDrive/Documents/GitHub/Neutron/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/rahul/OneDrive/Documents/GitHub/Neutron/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import tailwindcss from "file:///C:/Users/rahul/OneDrive/Documents/GitHub/Neutron/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\rahul\\OneDrive\\Documents\\GitHub\\Neutron\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react({
      // Fix React refresh detection issues
      fastRefresh: true,
      // Configure JSX runtime for Emotion
      jsxImportSource: "@emotion/react"
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      // This tells Vite: "When you see 'scenes', look in 'src/scenes'"
      scenes: path.resolve(__vite_injected_original_dirname, "./src/scenes"),
      state: path.resolve(__vite_injected_original_dirname, "./src/state"),
      components: path.resolve(__vite_injected_original_dirname, "./src/components")
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@emotion/react", "@emotion/styled"],
    exclude: ["@react-refresh"],
    force: true
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    }
  },
  define: {
    "process.env": "{}"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxyYWh1bFxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXE5ldXRyb25cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHJhaHVsXFxcXE9uZURyaXZlXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcTmV1dHJvblxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcmFodWwvT25lRHJpdmUvRG9jdW1lbnRzL0dpdEh1Yi9OZXV0cm9uL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KHtcclxuICAgICAgLy8gRml4IFJlYWN0IHJlZnJlc2ggZGV0ZWN0aW9uIGlzc3Vlc1xyXG4gICAgICBmYXN0UmVmcmVzaDogdHJ1ZSxcclxuICAgICAgLy8gQ29uZmlndXJlIEpTWCBydW50aW1lIGZvciBFbW90aW9uXHJcbiAgICAgIGpzeEltcG9ydFNvdXJjZTogJ0BlbW90aW9uL3JlYWN0JyxcclxuICAgIH0pLFxyXG4gICAgdGFpbHdpbmRjc3MoKSxcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIC8vIFRoaXMgdGVsbHMgVml0ZTogXCJXaGVuIHlvdSBzZWUgJ3NjZW5lcycsIGxvb2sgaW4gJ3NyYy9zY2VuZXMnXCJcclxuICAgICAgc2NlbmVzOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL3NjZW5lc1wiKSxcclxuICAgICAgc3RhdGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvc3RhdGVcIiksXHJcbiAgICAgIGNvbXBvbmVudHM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29tcG9uZW50c1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ0BlbW90aW9uL3JlYWN0JywgJ0BlbW90aW9uL3N0eWxlZCddLFxyXG4gICAgZXhjbHVkZTogWydAcmVhY3QtcmVmcmVzaCddLFxyXG4gICAgZm9yY2U6IHRydWUsXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGZzOiB7XHJcbiAgICAgIC8vIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSBvbmUgbGV2ZWwgdXAgdG8gdGhlIHByb2plY3Qgcm9vdFxyXG4gICAgICBhbGxvdzogWycuLiddLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGRlZmluZToge1xyXG4gICAgJ3Byb2Nlc3MuZW52JzogJ3t9JyxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VyxTQUFTLG9CQUFvQjtBQUMxWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8saUJBQWlCO0FBSHhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBLE1BRUosYUFBYTtBQUFBO0FBQUEsTUFFYixpQkFBaUI7QUFBQSxJQUNuQixDQUFDO0FBQUEsSUFDRCxZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRLEtBQUssUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDOUMsT0FBTyxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQzVDLFlBQVksS0FBSyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLElBQ3hEO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxrQkFBa0IsaUJBQWlCO0FBQUEsSUFDbkUsU0FBUyxDQUFDLGdCQUFnQjtBQUFBLElBQzFCLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixJQUFJO0FBQUE7QUFBQSxNQUVGLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGVBQWU7QUFBQSxFQUNqQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
