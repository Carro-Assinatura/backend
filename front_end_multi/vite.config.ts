import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
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

/**
 * URL e anon para o bundle: CI (process.env) + ficheiros .env (loadEnv).
 * Não usar `define` com strings vazias no dev — sobrescreve o .env local e mantém a faixa amarela no localhost.
 */
function resolveSupabaseForBundle(mode: string): { url: string; anon: string } {
  const fromFiles = loadEnv(mode, __dirname, "");
  const url = (
    process.env.VITE_SUPABASE_URL ||
    fromFiles.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    fromFiles.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    fromFiles.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  const anon = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    fromFiles.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    fromFiles.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fromFiles.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  return { url, anon };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { url: sbUrl, anon: sbAnon } = resolveSupabaseForBundle(mode);

  /**
   * Sem URL+anon no build, o bundle usa `invalid-env-not-set.supabase.co` (ver supabase.ts) —
   * o site parece “sem ligação ao Supabase” para sempre. Falhar aqui obriga a corrigir o CI
   * (ex.: Vercel/kingsengine sem VITE_* em Production).
   */
  if (
    mode === "production" &&
    process.env.ALLOW_EMPTY_SUPABASE_BUILD !== "true" &&
    (!sbUrl || !sbAnon)
  ) {
    throw new Error(
      "[vite] Build de produção sem Supabase: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY " +
        "(ou SUPABASE_URL + SUPABASE_ANON_KEY) no ambiente de build, depois redeploy. " +
        "Evita publicar JS com invalid-env-not-set.supabase.co. " +
        "Exceção (não recomendado): ALLOW_EMPTY_SUPABASE_BUILD=true",
    );
  }

  if (process.env.GITHUB_ACTIONS === "true" && (!sbUrl || !sbAnon)) {
    console.warn(
      "[vite] Supabase ausente no build (GitHub Actions). Defina secrets VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em: Repo → Settings → Secrets and variables → Actions.",
    );
  }

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
      /** Não usar 8081, 8082… se 8080 estiver livre; falha e avisa para libertar a porta. */
      strictPort: true,
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
    /* Só fixa no bundle quando há valor (CI/Vercel). Com strings vazias quebrava o `npm run dev` com .env local. */
    ...(sbUrl && sbAnon
      ? {
          define: {
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(sbUrl),
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(sbAnon),
          },
        }
      : {}),
  };
});
