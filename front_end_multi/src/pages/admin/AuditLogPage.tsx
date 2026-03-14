import { useState, useEffect, useCallback } from "react";
import { api, type AuditItem, type UserItem } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User,
  Activity,
  FileText,
  Calendar,
  Filter,
  Download,
} from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: "Login", color: "bg-blue-100 text-blue-700" },
  settings_update: { label: "Config. atualizada", color: "bg-amber-100 text-amber-700" },
  user_create: { label: "Usuário criado", color: "bg-green-100 text-green-700" },
  spreadsheet_create: { label: "Planilha criada", color: "bg-emerald-100 text-emerald-700" },
  spreadsheet_update: { label: "Planilha atualizada", color: "bg-teal-100 text-teal-700" },
  spreadsheet_delete: { label: "Planilha excluída", color: "bg-red-100 text-red-700" },
  car_image_create: { label: "Foto cadastrada", color: "bg-purple-100 text-purple-700" },
  car_image_delete: { label: "Foto excluída", color: "bg-rose-100 text-rose-700" },
};

const PAGE_SIZE = 25;

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  /* Filters */
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* Options for filters */
  const [actions, setActions] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    api.getAuditActions().then(setActions);
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAuditFull({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: search || undefined,
        action: actionFilter || undefined,
        userId: userFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(result.rows);
      setTotal(result.total);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setActionFilter("");
    setUserFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const hasActiveFilters = !!(search || actionFilter || userFilter || dateFrom || dateTo);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCSV = () => {
    const header = "Data,Usuário,Email,Ação,Detalhes";
    const rows = logs.map((l) =>
      [
        new Date(l.created_at).toLocaleString("pt-BR"),
        `"${l.user_name}"`,
        l.user_email,
        l.action,
        `"${l.details.replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    const info = ACTION_LABELS[action];
    if (info) {
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
    }
    return <Badge variant="outline" className="text-xs">{action}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log de Atividades</h1>
          <p className="text-slate-500 mt-1">
            Histórico completo de todas as ações realizadas no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="mr-1.5" size={14} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Pesquisar nos detalhes do log..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="default" size="default">
              Buscar
            </Button>
          </form>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="default"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-1.5" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ação</label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a]?.label || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Usuário</label>
              <Select value={userFilter} onValueChange={(v) => { setUserFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Data início</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Data fim</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              />
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                  <X size={14} className="mr-1" />
                  Limpar todos os filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
        <span>
          {total === 0
            ? "Nenhum registro encontrado"
            : `Mostrando ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total} registros`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="mx-auto mb-4 text-slate-300" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum log encontrado</h3>
          <p className="text-slate-500">
            {hasActiveFilters
              ? "Tente ajustar os filtros de busca."
              : "O histórico de atividades aparecerá aqui."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><Clock size={14} /> Data/Hora</div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><User size={14} /> Usuário</div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><Activity size={14} /> Ação</div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><FileText size={14} /> Detalhes</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(log.created_at).toLocaleDateString("pt-BR")}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{log.user_name}</div>
                      {log.user_email && (
                        <span className="text-xs text-slate-400">{log.user_email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
              <span className="text-sm text-slate-500">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
