import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, ArrowRight, Loader2, KeyRound, CornerDownLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useLogo } from "@/hooks/useLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useContactAction } from "@/hooks/useContactAction";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Modelos", href: "#modelos" },
  { label: "FAQ", href: "#faq" },
];

const Header = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { logoUrl } = useLogo();
  const { whatsappUrl, siteTitle } = useSiteSettings();
  const contact = useContactAction();
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoverSent, setRecoverSent] = useState(false);

  const resetForm = () => {
    setShowLogin(false);
    setShowRecover(false);
    setError("");
    setRecoverSent(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      resetForm();
      navigate("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no login";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Digite seu email"); return; }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email);
      if (err) throw err;
      setRecoverSent(true);
    } catch {
      setError("Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#inicio" className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 md:h-12 object-contain" />
          ) : (
            <span className="font-display text-xl md:text-2xl font-bold text-primary tracking-tight">
              {siteTitle}
            </span>
          )}
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}

          <button
            onClick={() => { showLogin ? resetForm() : setShowLogin(true); }}
            className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <LogIn size={15} />
            Login
          </button>

          {!showLogin ? (
            contact.type === "whatsapp" ? (
              <Button variant="cta" size="lg" asChild>
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              </Button>
            ) : (
              <Button variant="cta" size="lg" onClick={contact.onClick}>
                Falar no WhatsApp
              </Button>
            )
          ) : !showRecover ? (
            <form onSubmit={handleLogin} className="flex items-center gap-2 animate-fade-in">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-9 w-40 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-9 w-28 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-9 w-9 flex-shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                title="Entrar"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              </button>
              <button
                type="button"
                onClick={() => { setShowRecover(true); setError(""); }}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Esqueceu a senha?"
              >
                <KeyRound size={15} />
              </button>
              {error && <span className="text-xs text-red-500 whitespace-nowrap">{error}</span>}
            </form>
          ) : (
            <form onSubmit={handleRecover} className="flex items-center gap-2 animate-fade-in">
              <input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-9 w-48 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {recoverSent ? (
                <span className="text-xs text-green-500 whitespace-nowrap">Email enviado!</span>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 flex-shrink-0 rounded-lg bg-primary text-primary-foreground text-sm flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
                  Enviar
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowRecover(false); setRecoverSent(false); setError(""); }}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Voltar ao login"
              >
                <X size={15} />
              </button>
              {error && <span className="text-xs text-red-500 whitespace-nowrap">{error}</span>}
            </form>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-border/50 animate-fade-in">
          <nav className="container flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="text-base font-medium text-foreground/70 hover:text-primary transition-colors flex items-center gap-2"
            >
              <LogIn size={16} />
              Login
            </a>
            {contact.type === "whatsapp" ? (
              <Button variant="cta" size="lg" asChild className="w-full">
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              </Button>
            ) : (
              <Button variant="cta" size="lg" className="w-full" onClick={contact.onClick}>
                Falar no WhatsApp
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
