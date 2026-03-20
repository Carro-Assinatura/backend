import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { api, type AuditItem } from "@/services/api";
import { Settings, Users, Clock, BarChart2, Home, Megaphone, UserPlus, Loader2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACTION_LABEL: Record<string, string> = {
  login: "Fez login",
  settings_update: "Atualizou configurações",
  user_create: "Criou usuário",
};

const MESES: Record<number, string> = {
  0: "Janeiro", 1: "Fevereiro", 2: "Março", 3: "Abril", 4: "Maio", 5: "Junho",
  6: "Julho", 7: "Agosto", 8: "Setembro", 9: "Outubro", 10: "Novembro", 11: "Dezembro",
};

function getMesAno(month: number, year: number): string {
  return `${MESES[month] ?? ""} ${year}`;
}

function getMesesParaTras(count: number): { month: number; year: number }[] {
  const now = new Date();
  const items: { month: number; year: number }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    items.push({ month: d.getMonth(), year: d.getFullYear() });
  }
  return items;
}

interface PageStats {
  month: number;
  today: number;
  online: number;
}

type FilterMode = "mes" | "periodo";

interface ComparisonResult {
  periodA: { label: string; landing: PageStats; campanha: PageStats; cadastro: PageStats };
  periodB: { label: string; landing: PageStats; campanha: PageStats; cadastro: PageStats };
  today: { landing: number; campanha: number; cadastro: number };
  online: { landing: number; campanha: number; cadastro: number };
}

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const now = new Date();
  const [filterMode, setFilterMode] = useState<FilterMode>("mes");

  // Modo mês: 2 meses para comparação
  const [mes1, setMes1] = useState(now.getMonth());
  const [ano1, setAno1] = useState(now.getFullYear());
  const [mes2, setMes2] = useState(now.getMonth() - 1 >= 0 ? now.getMonth() - 1 : 11);
  const [ano2, setAno2] = useState(now.getMonth() - 1 >= 0 ? now.getFullYear() : now.getFullYear() - 1);

  // Modo período: 2 períodos para comparação
  const [periodoAFrom, setPeriodoAFrom] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [periodoATo, setPeriodoATo] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [periodoBFrom, setPeriodoBFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [periodoBTo, setPeriodoBTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });

  const mesesOpcoes = getMesesParaTras(24);

  useEffect(() => {
    if (hasRole("admin")) {
      api.getAudit(10).then(setAuditLogs).catch(() => {});
    }
  }, [hasRole]);

  const loadStats = () => {
    setStatsLoading(true);
    const opts =
      filterMode === "periodo"
        ? {
            mode: "periodo" as const,
            periodA: { dateFrom: periodoAFrom, dateTo: periodoATo },
            periodB: { dateFrom: periodoBFrom, dateTo: periodoBTo },
          }
        : {
            mode: "mes" as const,
            periodA: { month: mes1, year: ano1 },
            periodB: { month: mes2, year: ano2 },
          };
    api
      .getPageVisitorStatsComparison(opts)
      .then(setComparison)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [filterMode, mes1, ano1, mes2, ano2, periodoAFrom, periodoATo, periodoBFrom, periodoBTo]);

  const cards = [
    {
      title: "Fin Camp",
      description: "Inteligência de campanha, comportamento e conversão de leads via UTM",
      icon: BarChart2,
      color: "bg-indigo-500",
      action: () => navigate("/admin/fin-camp"),
      minRole: "analista",
    },
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
  ];

  const levels: Record<string, number> = { admin: 4, gerente: 3, marketing: 2, analista: 1 };
  const canSee = (minRole: string) => (levels[user?.role || ""] || 0) >= (levels[minRole] || 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bem-vindo(a) de volta, {user?.name?.split(" ")[0] ?? "usuário"}.</p>
      </div>

      {/* Filtros de análise (comparativo) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900">Filtros de análise (comparativo)</h3>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterMode("mes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterMode === "mes" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Por mês
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("periodo")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterMode === "periodo" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Por período
            </button>
          </div>
          {filterMode === "mes" ? (
            <>
              <div>
                <Label className="text-xs text-slate-500">Mês 1</Label>
                <Select
                  value={`${mes1}-${ano1}`}
                  onValueChange={(v) => {
                    const [m, y] = v.split("-").map(Number);
                    setMes1(m);
                    setAno1(y);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesOpcoes.map(({ month, year }) => (
                      <SelectItem key={`${month}-${year}`} value={`${month}-${year}`}>
                        {getMesAno(month, year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Mês 2</Label>
                <Select
                  value={`${mes2}-${ano2}`}
                  onValueChange={(v) => {
                    const [m, y] = v.split("-").map(Number);
                    setMes2(m);
                    setAno2(y);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesOpcoes.map(({ month, year }) => (
                      <SelectItem key={`${month}-${year}`} value={`${month}-${year}`}>
                        {getMesAno(month, year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Período 1</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={periodoAFrom}
                    onChange={(e) => setPeriodoAFrom(e.target.value)}
                    className="w-[140px]"
                  />
                  <span className="text-slate-400 text-sm">até</span>
                  <Input
                    type="date"
                    value={periodoATo}
                    onChange={(e) => setPeriodoATo(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Período 2</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={periodoBFrom}
                    onChange={(e) => setPeriodoBFrom(e.target.value)}
                    className="w-[140px]"
                  />
                  <span className="text-slate-400 text-sm">até</span>
                  <Input
                    type="date"
                    value={periodoBTo}
                    onChange={(e) => setPeriodoBTo(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3 visualizações sobre clientes (comparativo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Home className="text-white" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900">Landing Page</h3>
          </div>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-200 pr-4">
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodA.label}>
                    {comparison?.periodA.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodA.landing.month ?? 0}</span> clientes únicos
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodB.label}>
                    {comparison?.periodB.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodB.landing.month ?? 0}</span> clientes únicos
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.today.landing ?? 0}</span> usuários únicos hoje
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.online.landing ?? 0}</span> usuários online agora
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Megaphone className="text-white" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900">Campanha</h3>
          </div>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-200 pr-4">
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodA.label}>
                    {comparison?.periodA.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodA.campanha.month ?? 0}</span> clientes únicos
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodB.label}>
                    {comparison?.periodB.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodB.campanha.month ?? 0}</span> clientes únicos
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.today.campanha ?? 0}</span> usuários únicos hoje
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.online.campanha ?? 0}</span> usuários online agora
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <UserPlus className="text-white" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900">Cadastro</h3>
          </div>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-200 pr-4">
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodA.label}>
                    {comparison?.periodA.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodA.cadastro.month ?? 0}</span> clientes únicos
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 truncate" title={comparison?.periodB.label}>
                    {comparison?.periodB.label ?? "—"}
                  </p>
                  <p className="text-slate-700 text-sm">
                    <span className="font-semibold text-slate-900">{comparison?.periodB.cadastro.month ?? 0}</span> clientes únicos
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.today.cadastro ?? 0}</span> usuários únicos hoje
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{comparison?.online.cadastro ?? 0}</span> usuários online agora
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fin Camp, Configurações, Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {cards
          .filter((c) => canSee(c.minRole))
          .map((card) => (
            <div
              key={card.title}
              onClick={card.action}
              className="bg-white rounded-xl border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
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
