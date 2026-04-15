import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

/**
 * Copia og-social.png de public/ → dist/assets/ no fim do build.
 * Não depender de dist/og-social.png (cópia do public pode correr depois de closeBundle em alguns ambientes).
 */
function copyOgImageToAssets(): Plugin {
  return {
    name: "copy-og-image-to-assets",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const from = path.join(__dirname, "public", "og-social.png");
      const assetsDir = path.join(dist, "assets");
      if (!fs.existsSync(from) || !fs.existsSync(assetsDir)) return;
      fs.copyFileSync(from, path.join(assetsDir, "og-social.png"));
      fs.copyFileSync(from, path.join(dist, "og-social.png"));
    },
  };
}

/** Injeta fb:app_id no HTML de produção se VITE_FB_APP_ID estiver definida (só dígitos). */
function injectFbAppIdMeta(): Plugin {
  return {
    name: "inject-fb-app-id-meta",
    transformIndexHtml(html) {
      const raw = process.env.VITE_FB_APP_ID?.trim() ?? "";
      if (!/^\d+$/.test(raw)) return html;
      return html.replace(
        "</head>",
        `    <meta property="fb:app_id" content="${raw}" />\n  </head>`
      );
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
  plugins: [react(), injectFbAppIdMeta(), copyOgImageToAssets()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
