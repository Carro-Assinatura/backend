import { createClient } from "@supabase/supabase-js";

const rawUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const rawKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

/** Sem isto, o build na Vercel sem env quebra a app inteira: createClient('', '') lança "supabaseUrl is required". */
export const isSupabaseConfigured = Boolean(rawUrl && rawKey);

/** Só para o SDK não lançar na importação; nunca usar estes valores em produção real. */
const FALLBACK_URL = "https://invalid-env-not-set.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid_placeholder_do_not_use_in_production________________________________";

const supabaseUrl = isSupabaseConfigured ? rawUrl : FALLBACK_URL;
const anonKey = isSupabaseConfigured ? rawKey : FALLBACK_KEY;

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes no build. Vercel: Settings → Environment Variables → Production + Save → Redeploy sem cache.",
  );
}

const browserAuth = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: "pkce" as const,
};

export const supabase = createClient(supabaseUrl, anonKey, { auth: browserAuth });

export const supabaseIsolated = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
