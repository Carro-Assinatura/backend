import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, supabaseIsolated } from "@/lib/supabase";
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

const AuthContext = createContext<AuthState | null>(null);

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function fetchProfileREST(userId: string): Promise<{ id: string; name: string; role: string } | null> {
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/profiles?select=id,name,role&id=eq.${userId}`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchProfile(userId: string, email: string, attempt = 0): Promise<AuthUser | null> {
  if (attempt >= 2) {
    const row = await fetchProfileREST(userId);
    if (row) return { id: row.id, name: row.name, email, role: row.role };
    return null;
  }

  const { data, error } = await supabaseIsolated
    .from("profiles")
    .select("id, name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[fetchProfile] erro:", error.message, "attempt:", attempt);
    await new Promise((r) => setTimeout(r, 600));
    return fetchProfile(userId, email, attempt + 1);
  }

  if (!data) {
    console.warn("[fetchProfile] sem dados, attempt:", attempt);
    await new Promise((r) => setTimeout(r, 600));
    return fetchProfile(userId, email, attempt + 1);
  }

  return { id: data.id, name: data.name, email, role: data.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id, session.user.email ?? "");
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
        const profile = await fetchProfile(session.user.id, session.user.email ?? "");
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    if (data.user) {
      const profile = await fetchProfile(data.user.id, data.user.email ?? "");
      if (!profile) throw new Error("Perfil não encontrado. Contate o administrador.");
      if (!profile.role) throw new Error("Usuário sem permissão definida.");
      setUser(profile);

      supabase.from("audit_log").insert({
        user_id: data.user.id,
        action: "login",
        details: `Login: ${email}`,
      }).then(null, () => {});
    }
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
