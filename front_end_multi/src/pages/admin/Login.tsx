import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

/** Remove sessões antigas do Supabase no browser (mudança de URL do projecto / proxy). */
function clearSupabaseBrowserStorage(): void {
  try {
    for (const store of [localStorage, sessionStorage]) {
      const keys = Object.keys(store).filter((k) => k.startsWith("sb-"));
      for (const k of keys) store.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
              <Lock className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Intranet</h1>
            <p className="text-slate-500 text-sm mt-1">Multi Experiências</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1.5"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg whitespace-pre-wrap break-words">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
            Se o site só abre em <strong>aba anónima</strong> ou noutro navegador, a sessão ou cache deste browser pode estar antiga.
            <button
              type="button"
              className="mt-2 block w-full text-center text-primary underline underline-offset-2 hover:no-underline"
              onClick={() => {
                clearSupabaseBrowserStorage();
                window.location.reload();
              }}
            >
              Limpar sessão Supabase neste site e recarregar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
