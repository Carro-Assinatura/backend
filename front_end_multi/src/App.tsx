import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import CadastroPage from "./pages/CadastroPage.tsx";
import CampanhaPage from "./pages/CampanhaPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/admin/Login.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import SettingsPage from "./pages/admin/SettingsPage.tsx";
import UsersPage from "./pages/admin/UsersPage.tsx";
import SpreadsheetsPage from "./pages/admin/SpreadsheetsPage.tsx";
import AuditLogPage from "./pages/admin/AuditLogPage.tsx";
import TrackingPage from "./pages/admin/TrackingPage.tsx";
import BotConfigPage from "./pages/admin/BotConfigPage.tsx";
import ClientsPage from "./pages/admin/ClientsPage.tsx";
import FinCampPage from "./pages/admin/FinCampPage.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import TrackingScripts from "./components/TrackingScripts.tsx";
import VisitorTracker from "./components/VisitorTracker.tsx";
import ContactFloat from "./components/ContactFloat.tsx";
import FaviconSync from "./components/FaviconSync.tsx";
import { isSupabaseConfigured } from "@/lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: "online",
    },
  },
});

/** Após troca de rede ou tab em segundo plano, revalida dados (Supabase / API). */
function QueryRefetchOnReconnect() {
  const qc = useQueryClient();
  useEffect(() => {
    const bump = () => {
      void qc.invalidateQueries({ refetchType: "active" });
    };
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("online", bump);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("online", bump);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [qc]);
  return null;
}

/** BASE_URL da Vite é "/" na raiz; basename vazio quebra o React Router — usar undefined. */
const viteBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const routerBasename = viteBase.length > 0 ? viteBase : undefined;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QueryRefetchOnReconnect />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {!isSupabaseConfigured && (
        <div
          role="alert"
          className="fixed top-0 left-0 right-0 z-[9999] max-h-[min(50vh,100%)] overflow-y-auto bg-amber-500 px-4 py-3 text-left text-sm font-medium text-amber-950 shadow-md sm:text-center"
        >
          <p className="font-bold">Supabase não entrou neste build (o Vite grava URL e chave na hora da compilação).</p>
          <p className="mt-2 font-semibold">
            Onde o site está hospedado?
          </p>
          <p className="mt-1 text-xs sm:text-sm leading-snug">
            <strong>github.io</strong> (GitHub Pages): use <strong>GitHub</strong> → repositório →{" "}
            <strong>Settings → Secrets and variables → Actions</strong> → crie{" "}
            <code className="rounded bg-amber-600/30 px-1">VITE_SUPABASE_URL</code> e{" "}
            <code className="rounded bg-amber-600/30 px-1">VITE_SUPABASE_ANON_KEY</code> (valores do Supabase →
            Settings → API). Depois dispare o workflow <strong>Deploy site no GitHub Pages</strong> de novo. As
            variáveis da <strong>Vercel não entram</strong> neste deploy.
          </p>
          <p className="mt-2 text-xs sm:text-sm leading-snug">
            <strong>Vercel</strong> (*.vercel.app ou domínio ligado à Vercel):{" "}
            <strong>Project → Settings → Environment Variables</strong> com os mesmos nomes, ambiente{" "}
            <strong>Production</strong>, <strong>Save</strong> → <strong>Redeploy</strong> sem cache.
          </p>
          <p className="mt-2 text-xs opacity-90">
            Nomes aceitos no build: <code className="rounded bg-amber-600/25 px-1">VITE_SUPABASE_*</code> ou{" "}
            <code className="rounded bg-amber-600/25 px-1">SUPABASE_URL</code> +{" "}
            <code className="rounded bg-amber-600/25 px-1">SUPABASE_ANON_KEY</code>. Em builds na Vercel, nos logs
            procure <code className="rounded bg-amber-600/25 px-1">[vite] Supabase</code>.
          </p>
        </div>
      )}
      <ErrorBoundary>
        <BrowserRouter basename={routerBasename}>
          <AuthProvider>
            <FaviconSync />
            <TrackingScripts />
            <VisitorTracker />
            <Routes>
            <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
            <Route path="/cadastro" element={<ErrorBoundary><CadastroPage /></ErrorBoundary>} />
            <Route path="/campanha" element={<ErrorBoundary><CampanhaPage /></ErrorBoundary>} />

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="spreadsheets" element={<ErrorBoundary><SpreadsheetsPage /></ErrorBoundary>} />
              <Route path="fin-camp" element={<ErrorBoundary><FinCampPage /></ErrorBoundary>} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route path="bot-config" element={<BotConfigPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="logs" element={<AuditLogPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
            <ContactFloat />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
