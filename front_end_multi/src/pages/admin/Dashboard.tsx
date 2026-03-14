import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { api, type AuditItem } from "@/services/api";
import { Settings, Users, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  marketing: "Marketing",
  analista: "Analista",
};

const ACTION_LABEL: Record<string, string> = {
  login: "Fez login",
  settings_update: "Atualizou configurações",
  user_create: "Criou usuário",
};

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);

  useEffect(() => {
    if (hasRole("admin")) {
      api.getAudit(10).then(setAuditLogs).catch(() => {});
    }
  }, [hasRole]);

  const cards = [
    {
      title: "Configurações",
      description: "Google Sheets, imagens, WhatsApp",
      icon: Settings,
      color: "bg-blue-500",
      action: () => navigate("/admin/settings"),
      minRole: "gerente",
    },
    {
      title: "Usuários",
      description: "Gerenciar acessos e permissões",
      icon: Users,
      color: "bg-emerald-500",
      action: () => navigate("/admin/users"),
      minRole: "admin",
    },
    {
      title: "Seu Perfil",
      description: `${ROLE_LABEL[user?.role || ""] || user?.role} — ${user?.email}`,
      icon: Shield,
      color: "bg-purple-500",
      action: undefined,
      minRole: "analista",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bem-vindo(a) de volta, {user?.name.split(" ")[0]}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {cards
          .filter((c) => {
            const levels: Record<string, number> = { admin: 4, gerente: 3, marketing: 2, analista: 1 };
            return (levels[user?.role || ""] || 0) >= (levels[c.minRole] || 0);
          })
          .map((card) => (
            <div
              key={card.title}
              onClick={card.action}
              className={`bg-white rounded-xl border border-slate-200 p-6 ${card.action ? "cursor-pointer hover:shadow-md" : ""} transition-shadow`}
            >
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <card.icon className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{card.description}</p>
            </div>
          ))}
      </div>

      {hasRole("admin") && auditLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Atividade recente</h2>
          </div>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                <span className="font-medium text-slate-700">{log.user_name || "Sistema"}</span>
                <span className="text-slate-400">—</span>
                <span className="text-slate-600">{ACTION_LABEL[log.action] || log.action}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
