import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

/** BASE_URL da Vite é "/" na raiz; basename vazio quebra o React Router — usar undefined. */
const viteBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const routerBasename = viteBase.length > 0 ? viteBase : undefined;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {!isSupabaseConfigured && (
        <div
          role="alert"
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-md"
        >
          Variáveis{" "}
          <code className="rounded bg-amber-600/30 px-1">VITE_SUPABASE_URL</code> e{" "}
          <code className="rounded bg-amber-600/30 px-1">VITE_SUPABASE_ANON_KEY</code> não entraram neste
          build. Na Vercel: marque o ambiente <strong>Production</strong>, guarde e faça{" "}
          <strong>Redeploy</strong> (idealmente sem cache).
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
