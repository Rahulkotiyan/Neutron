import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // This tells Vite: "When you see 'scenes', look in 'src/scenes'"
      scenes: path.resolve(__dirname, "./src/scenes"),
      state: path.resolve(__dirname, "./src/state"),
      components: path.resolve(__dirname, "./src/components"),
    },
  },
});
