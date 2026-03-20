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
import TestimonialsPage from "./pages/admin/TestimonialsPage.tsx";
import FinCampPage from "./pages/admin/FinCampPage.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import TrackingScripts from "./components/TrackingScripts.tsx";
import VisitorTracker from "./components/VisitorTracker.tsx";
import ContactFloat from "./components/ContactFloat.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter basename={(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || ""}>
          <AuthProvider>
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
              <Route path="testimonials" element={<TestimonialsPage />} />
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
