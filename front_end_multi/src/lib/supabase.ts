import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !anonKey) {
  console.warn("Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
}

export const supabase = createClient(supabaseUrl ?? "", anonKey ?? "");

export const supabaseIsolated = createClient(supabaseUrl ?? "", anonKey ?? "", {
  auth: { autoRefreshToken: false, persistSession: false },
});
