import { Navigate, Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  BarChart2,
  Settings,
  Users,
  FileSpreadsheet,
  ScrollText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Megaphone,
  Radar,
  UserSearch,
  Bot,
  MessageSquareQuote,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  marketing: "Marketing",
  analista: "Analista",
};

const AdminLayout = () => {
  const { user, isLoading, logout, hasMinLevel } = useAuth();
  const { hasPermission } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-900 rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  // Ordem alfabética: grupos e itens dentro de cada grupo
  const navItems = [
    // COMERCIAL (Clientes, Planilhas)
    { to: "/admin/clients", icon: UserSearch, label: "Clientes", end: false, permissionKey: "menu_clients", minRole: "analista", group: "Comercial" },
    { to: "/admin/spreadsheets", icon: FileSpreadsheet, label: "Planilhas", end: false, permissionKey: "menu_planilhas", minRole: "gerente", group: "Comercial" },
    // CONFIGURAÇÕES (Conf Bot, Depoimentos, Geral, Usuários)
    { to: "/admin/bot-config", icon: Bot, label: "Conf Bot", end: false, permissionKey: "menu_bot_config", minRole: "gerente", group: "Configurações" },
    { to: "/admin/testimonials", icon: MessageSquareQuote, label: "Depoimentos", end: false, permissionKey: "menu_testimonials", minRole: "marketing", group: "Configurações" },
    { to: "/admin/settings", icon: Settings, label: "Geral", end: false, permissionKey: "menu_settings", minRole: "gerente", group: "Configurações" },
    { to: "/admin/users", icon: Users, label: "Usuários", end: false, permissionKey: "menu_users", minRole: "admin", group: "Configurações" },
    // DASHBOARD (Fin Camp, Visão Geral)
    { to: "/admin/fin-camp", icon: BarChart2, label: "Fin Camp", end: false, permissionKey: "menu_fin_camp", minRole: "analista", group: "Dashboard" },
    { to: "/admin", icon: LayoutDashboard, label: "Visão Geral", end: true, permissionKey: "menu_dashboard", minRole: "analista", group: "Dashboard" },
    // LOG (Logs)
    { to: "/admin/logs", icon: ScrollText, label: "Logs", end: false, permissionKey: "menu_logs", minRole: "admin", group: "Log" },
    // MARKETING (Tracking)
    { to: "/admin/tracking", icon: Radar, label: "Tracking", end: false, permissionKey: "menu_tracking", minRole: "marketing", group: "Marketing" },
  ];

  const visibleItems = navItems.filter((item) => {
    if (user?.role === "admin") return true;
    if (item.permissionKey) return hasPermission(item.permissionKey);
    return hasMinLevel(item.minRole);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:bg-black/20 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-lg">Multi Intranet</h2>
            <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>
          </div>
          <button
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            title="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {visibleItems.map((item, i) => {
            const prevGroup = i > 0 ? (visibleItems[i - 1] as any).group : undefined;
            const showGroup = (item as any).group && (item as any).group !== prevGroup;
            return (
              <div key={item.to}>
                {showGroup && (
                  <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                    {(item as any).group === "Dashboard" && <LayoutDashboard size={12} className="text-slate-500" />}
                    {(item as any).group === "Comercial" && <Briefcase size={12} className="text-slate-500" />}
                    {(item as any).group === "Configurações" && <Settings size={12} className="text-slate-500" />}
                    {(item as any).group === "Log" && <ScrollText size={12} className="text-slate-500" />}
                    {(item as any).group === "Marketing" && <Megaphone size={12} className="text-slate-500" />}
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{(item as any).group}</span>
                  </div>
                )}
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-out ${
          sidebarOpen ? "lg:ml-64" : ""
        }`}
      >
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-slate-100"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            <Menu size={20} />
          </Button>
          <div className="flex-1" />
          <span className="text-sm text-slate-500">Olá, {user.name.split(" ")[0]}</span>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
