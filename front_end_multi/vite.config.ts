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

/** Lê URL e anon do processo de build (Vercel injeta em process.env). Aceita nomes sem prefixo VITE_. */
function supabaseEnvForBundle(): { url: string; anon: string } {
  const url = (
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();
  const anon = (
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();
  return { url, anon };
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  const { url: sbUrl, anon: sbAnon } = supabaseEnvForBundle();

  if (process.env.VERCEL && (!sbUrl || !sbAnon)) {
    const relatedKeys = Object.keys(process.env).filter(
      (k) =>
        k.toUpperCase().includes("SUPABASE") ||
        (k.startsWith("VITE_") && k.toUpperCase().includes("SUPA")),
    );
    console.warn(
      "[vite] Supabase ausente no build (Vercel). Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para Production, ou SUPABASE_URL + SUPABASE_ANON_KEY.",
      relatedKeys.length ? `Chaves encontradas: ${relatedKeys.sort().join(", ")}` : "Nenhuma chave SUPABASE/VITE_* encontrada no ambiente do build.",
    );
  }

  return {
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
    /* Embute URL/anon no bundle; aceita também SUPABASE_URL / SUPABASE_ANON_KEY (sem VITE_). */
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(sbUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(sbAnon),
    },
  };
});
