import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

function preloadCriticalChunks(criticalNames) {
  return {
    name: "preload-critical-chunks",
    enforce: "post",
    generateBundle(_, bundle) {
      const links = [];
      for (const [fileName, info] of Object.entries(bundle)) {
        if (info.type === "chunk" && criticalNames.includes(info.name)) {
          links.push(`<link rel="modulepreload" crossorigin href="/${fileName}">`);
        }
      }
      if (!links.length) return;
      for (const [fileName, info] of Object.entries(bundle)) {
        if (fileName.endsWith(".html") && info.type === "asset") {
          const html = typeof info.source === "string" ? info.source : new TextDecoder().decode(info.source);
          info.source = html.replace(/\n\s*<\/head>/, `\n    ${links.join("\n    ")}\n  </head>`);
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    preloadCriticalChunks(["HomePage", "PostCard"]),
  ],
  resolve: {
    alias: {
      scenes: path.resolve(__dirname, "./src/scenes"),
      state: path.resolve(__dirname, "./src/state"),
      components: path.resolve(__dirname, "./src/components"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("node_modules/react-router") || id.includes("node_modules/axios")) return "vendor";
          if (id.includes("node_modules/firebase")) return "firebase";
          if (id.includes("node_modules/iconoir-react")) return "icons";
          if (id.includes("node_modules/react-toastify")) return "ui";
          if (id.includes("node_modules/posthog-js")) return "analytics";
          if (id.includes("node_modules/socket.io-client")) return "socket";
        },
      },
    },
  },
});
