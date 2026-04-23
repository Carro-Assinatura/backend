/**
 * URLs públicas do Storage gravadas na BD costumam ser `https://<ref>.supabase.co/storage/v1/...`.
 * Com proxy (VITE_SUPABASE_URL = workers.dev), o REST passa pelo proxy mas <img src> não —
 * em redes que não resolvem *.supabase.co, as imagens quebram. Reescreve só Storage no mesmo path.
 */
export function rewriteSupabaseMediaUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (!s) return "";
  const base = String(import.meta.env.VITE_SUPABASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!base) return s;
  try {
    const u = new URL(s);
    if (u.hostname.toLowerCase().endsWith(".supabase.co") && u.pathname.includes("/storage/v1/")) {
      return `${base}${u.pathname}${u.search}`;
    }
  } catch {
    return s;
  }
  return s;
}
