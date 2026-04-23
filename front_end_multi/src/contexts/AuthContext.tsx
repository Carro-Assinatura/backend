import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/services/api";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  hasMinLevel: (minRole: string) => boolean;
}

const ROLE_LEVEL: Record<string, number> = {
  admin: 4,
  gerente: 3,
  marketing: 2,
  analista: 1,
};

/** Mensagens comuns do GoTrue em inglês → texto útil em produção. */
function mapAuthLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "E-mail ou palavra-passe incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "E-mail ainda não confirmado. Abre o link que o Supabase enviou, ou em Supabase → Authentication → Providers desactiva «Confirm email» para testes.";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "Muitas tentativas. Espera alguns minutos e tenta de novo.";
  }
  return message;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfileREST(
  userId: string,
  accessToken: string | null | undefined,
): Promise<{ id: string; name: string; role: string } | null> {
  const base = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  if (!base || !key) return null;
  const bearer = accessToken?.trim() ? accessToken.trim() : key;
  try {
    const res = await fetch(
      `${base}/rest/v1/profiles?select=id,name,role&id=eq.${userId}`,
      { headers: { apikey: key, Authorization: `Bearer ${bearer}` } },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchProfile(
  userId: string,
  email: string,
  accessToken: string | null | undefined,
  attempt = 0,
): Promise<AuthUser | null> {
  if (attempt >= 2) {
    const row = await fetchProfileREST(userId, accessToken);
    if (row) return { id: row.id, name: row.name, email, role: row.role };
    return null;
  }

  /** Cliente principal: envia o JWT da sessão (RLS). Isolated não partilha sessão com signIn. */
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[fetchProfile] erro:", error.message, "attempt:", attempt);
    await new Promise((r) => setTimeout(r, 600));
    return fetchProfile(userId, email, accessToken, attempt + 1);
  }

  if (!data) {
    console.warn("[fetchProfile] sem dados, attempt:", attempt);
    await new Promise((r) => setTimeout(r, 600));
    return fetchProfile(userId, email, accessToken, attempt + 1);
  }

  return { id: data.id, name: data.name, email, role: data.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id, session.user.email ?? "", session.access_token);
      setUser(profile);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? "", session.access_token);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthLoginError(error.message));

    if (!data.user) throw new Error("Resposta de autenticação incompleta. Tenta de novo.");

    /**
     * Não usar await setSession() aqui: o signInWithPassword já actualiza o cliente; setSession
     * pode bloquear ou competir com onAuthStateChange + fetchProfile noutro tick (spinner infinito em produção).
     */
    const accessToken = data.session?.access_token;

    let profile = await fetchProfile(data.user.id, data.user.email ?? "", accessToken);

    if (!profile) {
      const { data: prow, error: peek } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (peek) {
        await supabase.auth.signOut();
        throw new Error(
          `Não foi possível ler o perfil: ${peek.message}. ` +
            "Confirma no Supabase que executaste o SQL de RLS (ex.: supabase-fix-rls.sql) e que o proxy Cloudflare não bloqueia pedidos REST.",
        );
      }
      if (!prow) {
        await supabase.auth.signOut();
        throw new Error(
          "A conta existe em Authentication mas não há linha em «profiles» com o mesmo id. " +
            "Um administrador deve criar o utilizador na intranet (Utilizadores) ou sincronizar auth → profiles.",
        );
      }
      if (!prow.role) {
        await supabase.auth.signOut();
        throw new Error("O teu utilizador existe em «profiles» mas sem cargo (role). Peça ao administrador para definir a função.");
      }
      profile = {
        id: prow.id,
        name: prow.name ?? "",
        email: data.user.email ?? "",
        role: prow.role,
      };
    }

    if (!profile.role) {
      await supabase.auth.signOut();
      throw new Error("Usuário sem permissão definida (role vazio).");
    }

    setUser(profile);

    supabase.from("audit_log").insert({
      user_id: data.user.id,
      action: "login",
      details: `Login: ${email}`,
    }).then(null, () => {});
  };

  const logout = () => {
    supabase.auth.signOut().then(() => {
      setUser(null);
    });
  };

  const hasRole = (...roles: string[]) => !!user && roles.includes(user.role);

  const hasMinLevel = (minRole: string) => {
    if (!user) return false;
    return (ROLE_LEVEL[user.role] || 0) >= (ROLE_LEVEL[minRole] || 0);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole, hasMinLevel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
