/**
 * Fin Camp — Dashboard analítico de campanhas, comportamento e conversão
 *
 * Consolida performance comercial e comportamental dos leads por UTM.
 * Preparado para BigQuery como camada principal de dados.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  FileCheck,
  PenLine,
  Truck,
  TrendingUp,
  DollarSign,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import { FinCampKPICard } from "@/components/fin-camp/FinCampKPICard";
import { FinCampChartBlock } from "@/components/fin-camp/FinCampChartBlock";
import {
  type FinCampFilters,
  getFinCampKPIs,
  getFilterOptions,
  getFunnelData,
  getLeadsByUtmSource,
  getLeadsByUtmCampaign,
  getContratosByUtmCampaign,
  getReceitaByUtmCampaign,
  getVisitorsByLandingPage,
  getAvgTimeByCampaign,
  getFinCampLeadsTable,
  type FinCampLeadRow,
} from "@/services/finCampApi";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const STORAGE_KEY = "fin-camp-filters";

const defaultFilters: FinCampFilters = {
  dateFrom: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  dateTo: format(new Date(), "yyyy-MM-dd"),
};

function loadStoredFilters(): FinCampFilters {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return { ...defaultFilters, ...parsed };
    }
  } catch {
    // Ignora dados corrompidos no sessionStorage
  }
  return defaultFilters;
}

function saveFilters(f: FinCampFilters) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {}
}

const FUNNEL_LABELS: Record<string, string> = {
  visitante: "Visitante",
  lead: "Lead",
  qualificado: "Qualificado",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechamento: "Fechamento",
  cliente: "Cliente",
};

const CREDIT_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

const CONTRACT_LABELS: Record<string, string> = {
  sem_contrato: "Sem Contrato",
  ativo: "Ativo",
  renovacao_pendente: "Renovação Pendente",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
};

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

function fmtDateTime(d: string) {
  return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

const PAGE_SIZE = 20;

/** Garante que o value do Select exista nas opções (Radix exige match) */
function selectValue(
  current: string | undefined,
  options: string[] | undefined,
  fallback = "__all__"
): string {
  if (!current || current === "__all__") return fallback;
  const opts = options ?? [];
  return opts.includes(current) ? current : fallback;
}

export default function FinCampPage() {
  const [filters, setFilters] = useState<FinCampFilters>(loadStoredFilters);
  const [filterOptions, setFilterOptions] = useState<Awaited<ReturnType<typeof getFilterOptions>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Data state */
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getFinCampKPIs>> | null>(null);
  const [funnel, setFunnel] = useState<Awaited<ReturnType<typeof getFunnelData>>>([]);
  const [leadsBySource, setLeadsBySource] = useState<Awaited<ReturnType<typeof getLeadsByUtmSource>>>([]);
  const [leadsByCampaign, setLeadsByCampaign] = useState<Awaited<ReturnType<typeof getLeadsByUtmCampaign>>>([]);
  const [contratosByCampaign, setContratosByCampaign] = useState<Awaited<ReturnType<typeof getContratosByUtmCampaign>>>([]);
  const [receitaByCampaign, setReceitaByCampaign] = useState<Awaited<ReturnType<typeof getReceitaByUtmCampaign>>>([]);
  const [visitorsByPage, setVisitorsByPage] = useState<Awaited<ReturnType<typeof getVisitorsByLandingPage>>>([]);
  const [avgTimeByCampaign, setAvgTimeByCampaign] = useState<Awaited<ReturnType<typeof getAvgTimeByCampaign>>>([]);

  const [tablePage, setTablePage] = useState(0);
  const [tableData, setTableData] = useState<{ rows: FinCampLeadRow[]; total: number }>({ rows: [], total: 0 });

  const updateFilter = (key: keyof FinCampFilters, value: any) => {
    setFilters((p) => {
      const next = { ...p, [key]: value };
      saveFilters(next);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    saveFilters(defaultFilters);
    setTablePage(0);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        kpisRes,
        funnelRes,
        leadsSourceRes,
        leadsCampaignRes,
        contratosCampaignRes,
        receitaCampaignRes,
        visitorsPageRes,
        avgTimeRes,
        optionsRes,
      ] = await Promise.all([
        getFinCampKPIs(filters),
        getFunnelData(filters),
        getLeadsByUtmSource(filters),
        getLeadsByUtmCampaign(filters),
        getContratosByUtmCampaign(filters),
        getReceitaByUtmCampaign(filters),
        getVisitorsByLandingPage(filters),
        getAvgTimeByCampaign(filters),
        getFilterOptions(filters),
      ]);
      setKpis(kpisRes);
      setFunnel(funnelRes);
      setLeadsBySource(leadsSourceRes);
      setLeadsByCampaign(leadsCampaignRes);
      setContratosByCampaign(contratosCampaignRes);
      setReceitaByCampaign(receitaCampaignRes);
      setVisitorsByPage(visitorsPageRes);
      setAvgTimeByCampaign(avgTimeRes);
      setFilterOptions(optionsRes);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadTable = useCallback(async () => {
    try {
      const res = await getFinCampLeadsTable(filters, { limit: PAGE_SIZE, offset: tablePage * PAGE_SIZE });
      setTableData(res);
    } catch {
      setTableData({ rows: [], total: 0 });
    }
  }, [filters, tablePage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  const exportCSV = () => {
    const headers = [
      "Data", "Nome", "Telefone", "Email", "UTM Source", "UTM Medium", "UTM Campaign",
      "Cidade", "Estado", "Modelo", "Status Lead", "Status Crédito", "Status Contrato",
      "Data Assinatura", "Receita", "Tempo até conversão (min)",
    ];
    const rows = tableData.rows.map((r) => [
      fmtDate(r.date),
      r.name,
      r.phone,
      r.email,
      r.utmSource,
      r.utmMedium,
      r.utmCampaign,
      r.city,
      r.state,
      r.carModel,
      r.leadStatus,
      r.creditStatus,
      r.contractStatus,
      r.signedAt ? fmtDate(r.signedAt) : "",
      r.revenue,
      r.timeToConversion,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fin-camp-leads-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Fin Camp</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fin Camp</h1>
        <p className="text-slate-500 mt-1">
          Inteligência de campanha, comportamento e conversão de leads via UTM
        </p>
      </div>

      {/* Filtros globais */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-500" />
          <span className="font-medium text-slate-700">Filtros globais</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
            <X size={14} className="mr-1" /> Limpar
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Período (de)</label>
            <Input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Período (até)</label>
            <Input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">UTM Source</label>
            <Select
              value={selectValue(filters.utmSource?.[0], filterOptions?.utmSource)}
              onValueChange={(v) => updateFilter("utmSource", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.utmSource ?? []).map((s) => (
                  <SelectItem key={s} value={s || "__empty__"}>{s || "(vazio)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">UTM Medium</label>
            <Select
              value={selectValue(filters.utmMedium?.[0], filterOptions?.utmMedium)}
              onValueChange={(v) => updateFilter("utmMedium", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.utmMedium ?? []).map((m) => (
                  <SelectItem key={m} value={m || "__empty__"}>{m || "(vazio)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">UTM Campaign</label>
            <Select
              value={selectValue(filters.utmCampaign?.[0], filterOptions?.utmCampaign)}
              onValueChange={(v) => updateFilter("utmCampaign", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.utmCampaign ?? []).map((c) => (
                  <SelectItem key={c} value={c || "__empty__"}>{c || "(vazio)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dispositivo</label>
            <Select
              value={selectValue(filters.device?.[0], filterOptions?.device)}
              onValueChange={(v) => updateFilter("device", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.device ?? []).map((d) => (
                  <SelectItem key={d} value={d || "__empty__"}>{d || "(vazio)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <Select
              value={selectValue(filters.state?.[0], filterOptions?.state)}
              onValueChange={(v) => updateFilter("state", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.state ?? []).map((s) => (
                  <SelectItem key={s} value={s || "__empty__"}>{s || "(vazio)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Perfil</label>
            <Select
              value={selectValue(filters.personType?.[0], ["__all__", "pf", "pj"])}
              onValueChange={(v) => updateFilter("personType", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="pf">PF</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status Lead</label>
            <Select
              value={selectValue(filters.leadStatus?.[0], filterOptions?.leadStatus)}
              onValueChange={(v) => updateFilter("leadStatus", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.leadStatus ?? []).map((s) => (
                  <SelectItem key={s} value={s}>{FUNNEL_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status Crédito</label>
            <Select
              value={selectValue(filters.creditStatus?.[0], filterOptions?.creditStatus)}
              onValueChange={(v) => updateFilter("creditStatus", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.creditStatus ?? []).map((s) => (
                  <SelectItem key={s} value={s}>{CREDIT_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status Contrato</label>
            <Select
              value={selectValue(filters.contractStatus?.[0], filterOptions?.contractStatus)}
              onValueChange={(v) => updateFilter("contractStatus", v && v !== "__all__" ? [v] : undefined)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {(filterOptions?.contractStatus ?? []).map((s) => (
                  <SelectItem key={s} value={s}>{CONTRACT_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-slate-400" size={40} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <FinCampKPICard
              title="Visitantes"
              value={kpis?.visitantes ?? 0}
              tooltip="Visitantes únicos que acessaram o site no período"
              icon={<Users size={20} />}
            />
            <FinCampKPICard
              title="Leads gerados"
              value={kpis?.leadsGerados ?? 0}
              tooltip="Leads que iniciaram cadastro ou contato"
              icon={<UserPlus size={20} />}
            />
            <FinCampKPICard
              title="Conversas iniciadas"
              value={kpis?.conversasIniciadas ?? 0}
              tooltip="Cliques em WhatsApp ou abertura do bot"
              icon={<MessageCircle size={20} />}
            />
            <FinCampKPICard
              title="Documentos enviados"
              value={kpis?.documentosEnviados ?? 0}
              tooltip="Documentos enviados para análise de crédito"
              icon={<FileText size={20} />}
            />
            <FinCampKPICard
              title="Cadastros aprovados"
              value={kpis?.cadastrosAprovados ?? 0}
              tooltip="Análise de crédito aprovada"
              icon={<CheckCircle size={20} />}
              variant="success"
            />
            <FinCampKPICard
              title="Cadastros reprovados"
              value={kpis?.cadastrosReprovados ?? 0}
              tooltip="Análise de crédito reprovada"
              icon={<XCircle size={20} />}
              variant="danger"
            />
            <FinCampKPICard
              title="Contratos gerados"
              value={kpis?.contratosGerados ?? 0}
              tooltip="Contratos criados"
              icon={<FileCheck size={20} />}
            />
            <FinCampKPICard
              title="Contratos assinados"
              value={kpis?.contratosAssinados ?? 0}
              tooltip="Contratos efetivamente assinados"
              icon={<PenLine size={20} />}
              variant="success"
            />
            <FinCampKPICard
              title="Entregas programadas"
              value={kpis?.entregasProgramadas ?? 0}
              tooltip="Entregas agendadas"
              icon={<Truck size={20} />}
            />
            <FinCampKPICard
              title="Taxa visita → lead"
              value={`${(kpis?.taxaVisitaLead ?? 0).toFixed(1)}%`}
              tooltip="Percentual de visitantes que viraram lead"
              icon={<TrendingUp size={20} />}
            />
            <FinCampKPICard
              title="Taxa lead → docs"
              value={`${(kpis?.taxaLeadDocumentos ?? 0).toFixed(1)}%`}
              tooltip="Percentual de leads que enviaram documentos"
              icon={<TrendingUp size={20} />}
            />
            <FinCampKPICard
              title="Taxa docs → aprovação"
              value={`${(kpis?.taxaDocumentosAprovacao ?? 0).toFixed(1)}%`}
              tooltip="Percentual de documentos que resultaram em aprovação"
              icon={<TrendingUp size={20} />}
            />
            <FinCampKPICard
              title="Taxa aprovação → assinatura"
              value={`${(kpis?.taxaAprovacaoAssinatura ?? 0).toFixed(1)}%`}
              tooltip="Percentual de aprovados que assinaram"
              icon={<TrendingUp size={20} />}
            />
            <FinCampKPICard
              title="Taxa visita → contrato"
              value={`${(kpis?.taxaVisitaContrato ?? 0).toFixed(1)}%`}
              tooltip="Conversão total visita até contrato assinado"
              icon={<TrendingUp size={20} />}
              variant="success"
            />
            {kpis?.receitaGerada != null && kpis.receitaGerada > 0 && (
              <>
                <FinCampKPICard
                  title="Receita gerada"
                  value={fmtCurrency(kpis.receitaGerada)}
                  tooltip="Receita total dos contratos no período"
                  icon={<DollarSign size={20} />}
                  variant="success"
                />
                <FinCampKPICard
                  title="Ticket médio"
                  value={fmtCurrency(kpis.ticketMedio ?? 0)}
                  tooltip="Valor médio por contrato"
                  icon={<DollarSign size={20} />}
                />
                <FinCampKPICard
                  title="Receita por visitante"
                  value={fmtCurrency(kpis.receitaPorVisitante ?? 0)}
                  tooltip="Receita total dividida por visitantes"
                  icon={<DollarSign size={20} />}
                />
                <FinCampKPICard
                  title="Receita por lead"
                  value={fmtCurrency(kpis.receitaPorLead ?? 0)}
                  tooltip="Receita total dividida por leads"
                  icon={<DollarSign size={20} />}
                />
              </>
            )}
          </div>

          {/* Bloco A — Aquisição por UTM */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Aquisição por UTM</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FinCampChartBlock
                title="Leads por UTM Source"
                data={leadsBySource}
                type="bar"
                emptyMessage="Nenhum lead no período"
              />
              <FinCampChartBlock
                title="Leads por UTM Campaign"
                data={leadsByCampaign}
                type="horizontalBar"
                emptyMessage="Nenhum lead no período"
              />
              <FinCampChartBlock
                title="Contratos assinados por UTM Campaign"
                data={contratosByCampaign}
                type="horizontalBar"
                emptyMessage="Nenhum contrato no período"
              />
              <FinCampChartBlock
                title="Receita por UTM Campaign"
                data={receitaByCampaign}
                type="horizontalBar"
                emptyMessage="Nenhuma receita no período"
              />
            </div>
          </section>

          {/* Bloco B — Performance da Landing Page */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance da Landing Page</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinCampChartBlock
                title="Visitantes por página de entrada"
                description="Primeira página vista na sessão"
                data={visitorsByPage}
                type="horizontalBar"
                emptyMessage="Nenhum visitante no período"
              />
              <FinCampChartBlock
                title="Tempo médio na página por campanha (seg)"
                description="Integração Clarity: preparado para dados de sessão"
                data={avgTimeByCampaign}
                type="bar"
                emptyMessage="Dados de duração não disponíveis"
              />
            </div>
          </section>

          {/* Bloco D — Funil completo */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Funil completo</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <div className="min-w-[600px] p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {funnel.map((step, i) => (
                    <div
                      key={step.label}
                      className="flex-shrink-0 w-36 rounded-lg border border-slate-200 p-3 text-center"
                    >
                      <p className="text-xs font-medium text-slate-500 truncate">{step.label}</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{step.count}</p>
                      {i > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          {step.conversionFromPrev.toFixed(1)}% conv.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tabela detalhada */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Tabela de leads</h2>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-1" /> Exportar CSV
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              {tableData.rows.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Nenhum lead no período</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Data</th>
                      <th className="text-left px-4 py-3 font-medium">Nome</th>
                      <th className="text-left px-4 py-3 font-medium">Contato</th>
                      <th className="text-left px-4 py-3 font-medium">UTM</th>
                      <th className="text-left px-4 py-3 font-medium">Local</th>
                      <th className="text-left px-4 py-3 font-medium">Modelo</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tableData.rows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{fmtDate(r.date)}</td>
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-slate-600">{r.phone || r.email}</td>
                        <td className="px-4 py-3 text-xs">
                          {[r.utmSource, r.utmMedium, r.utmCampaign].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.city && r.state ? `${r.city}/${r.state}` : "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{r.carModel || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs">{FUNNEL_LABELS[r.leadStatus] ?? r.leadStatus}</span>
                          <span className="text-xs text-slate-400 block">{CREDIT_LABELS[r.creditStatus] ?? r.creditStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{r.revenue > 0 ? fmtCurrency(r.revenue) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tableData.total > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
                  <span>
                    Página {tablePage + 1} de {Math.ceil(tableData.total / PAGE_SIZE)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={tablePage === 0}
                      onClick={() => setTablePage((p) => p - 1)}
                    >
                      <ChevronLeft size={14} /> Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={tablePage >= Math.ceil(tableData.total / PAGE_SIZE) - 1}
                      onClick={() => setTablePage((p) => p + 1)}
                    >
                      Próxima <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
