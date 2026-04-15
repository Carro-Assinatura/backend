import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

/** Garante og-social.png em /assets/ (mesmo bundle do deploy) para crawlers e SPA rewrites. */
function copyOgImageToAssets(): Plugin {
  return {
    name: "copy-og-image-to-assets",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const from = path.join(dist, "og-social.png");
      if (!fs.existsSync(from)) return;
      const assetsDir = path.join(dist, "assets");
      if (!fs.existsSync(assetsDir)) return;
      fs.copyFileSync(from, path.join(assetsDir, "og-social.png"));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), copyOgImageToAssets()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
