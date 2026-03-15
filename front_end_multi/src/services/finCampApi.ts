/**
 * Fin Camp API — Camada de dados para o dashboard analítico
 *
 * Consolida dados de:
 * - client_tracking_events (visitantes, pageviews, sessões)
 * - clients (leads, crédito, contrato)
 * - client_documents (documentos enviados)
 *
 * Preparado para integração futura com BigQuery como camada principal.
 * Atribuição: first-touch (UTM da primeira sessão) por padrão.
 */

import { supabase } from "@/lib/supabase";

/* ── Tipos ───────────────────────────────────────────────── */

export interface FinCampFilters {
  dateFrom?: string;
  dateTo?: string;
  utmSource?: string[];
  utmMedium?: string[];
  utmCampaign?: string[];
  utmContent?: string[];
  utmTerm?: string[];
  channel?: string[];
  device?: string[];
  city?: string[];
  state?: string[];
  carModel?: string[];
  personType?: string[];
  leadStatus?: string[];
  creditStatus?: string[];
  contractStatus?: string[];
}

export interface FinCampKPIs {
  visitantes: number;
  leadsGerados: number;
  conversasIniciadas: number;
  documentosEnviados: number;
  cadastrosAprovados: number;
  cadastrosReprovados: number;
  contratosGerados: number;
  contratosAssinados: number;
  entregasProgramadas: number;
  taxaVisitaLead: number;
  taxaLeadDocumentos: number;
  taxaDocumentosAprovacao: number;
  taxaAprovacaoAssinatura: number;
  taxaVisitaContrato: number;
  cac?: number;
  receitaGerada?: number;
  ticketMedio?: number;
  receitaPorVisitante?: number;
  receitaPorLead?: number;
  // Variação vs período anterior (%)
  _variations?: Partial<Record<keyof Omit<FinCampKPIs, "_variations">, number>>;
}

export interface FunnelStep {
  label: string;
  count: number;
  conversionFromPrev: number;
  lossFromPrev: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface FinCampLeadRow {
  id: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  landingPage: string;
  device: string;
  city: string;
  state: string;
  carModel: string;
  leadStatus: string;
  creditStatus: string;
  contractStatus: string;
  signedAt: string | null;
  revenue: number;
  timeToConversion: number; // minutos
}

/* ── Helpers ─────────────────────────────────────────────── */

function mapEmpty(v: string) {
  return v === "__empty__" ? "" : v;
}

function buildEventFilters(f: FinCampFilters) {
  let q = supabase.from("client_tracking_events").select("*");
  if (f.dateFrom) q = q.gte("created_at", f.dateFrom);
  if (f.dateTo) q = q.lte("created_at", f.dateTo + "T23:59:59.999Z");
  if (f.utmSource?.length) q = q.in("utm_source", f.utmSource.map(mapEmpty));
  if (f.utmMedium?.length) q = q.in("utm_medium", f.utmMedium.map(mapEmpty));
  if (f.utmCampaign?.length) q = q.in("utm_campaign", f.utmCampaign.map(mapEmpty));
  if (f.device?.length) q = q.in("device", f.device.map(mapEmpty));
  return q;
}

function buildClientFilters(f: FinCampFilters) {
  let q = supabase.from("clients").select("*");
  if (f.dateFrom) q = q.gte("created_at", f.dateFrom);
  if (f.dateTo) q = q.lte("created_at", f.dateTo + "T23:59:59.999Z");
  if (f.utmSource?.length) q = q.in("utm_source", f.utmSource.map(mapEmpty));
  if (f.utmMedium?.length) q = q.in("utm_medium", f.utmMedium.map(mapEmpty));
  if (f.utmCampaign?.length) q = q.in("utm_campaign", f.utmCampaign.map(mapEmpty));
  if (f.personType?.length) q = q.in("person_type", f.personType);
  if (f.leadStatus?.length) q = q.in("funnel_stage", f.leadStatus);
  if (f.creditStatus?.length) q = q.in("credit_status", f.creditStatus);
  if (f.contractStatus?.length) q = q.in("contract_status", f.contractStatus);
  if (f.state?.length) q = q.in("state", f.state);
  if (f.city?.length) q = q.in("city", f.city);
  if (f.carModel?.length) {
    const or = f.carModel.map((m) => `contract_vehicle.ilike.%${m}%`).join(",");
    q = q.or(or);
  }
  return q;
}

/* ── API ───────────────────────────────────────────────── */

/**
 * Busca visitantes únicos (visitor_id) do período filtrado
 */
export async function getUniqueVisitors(filters: FinCampFilters): Promise<number> {
  const { data } = await buildEventFilters(filters)
    .select("visitor_id")
    .eq("event_type", "pageview");
  const ids = new Set((data ?? []).map((r) => r.visitor_id).filter(Boolean));
  return ids.size;
}

/**
 * Busca todos os eventos do período para agregação
 */
export async function getEventsForFinCamp(filters: FinCampFilters): Promise<any[]> {
  const { data } = await buildEventFilters(filters).order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * Busca todos os clientes do período para agregação
 */
export async function getClientsForFinCamp(filters: FinCampFilters): Promise<any[]> {
  const { data } = await buildClientFilters(filters).order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * Busca documentos enviados para clientes no período
 */
export async function getDocumentsForFinCamp(filters: FinCampFilters): Promise<number> {
  const clients = await getClientsForFinCamp(filters);
  const clientIds = clients.map((c) => c.id);
  if (clientIds.length === 0) return 0;
  const { data } = await supabase
    .from("client_documents")
    .select("id")
    .in("client_id", clientIds);
  return (data ?? []).length;
}

/**
 * Opções para filtros (valores únicos do banco)
 */
export async function getFilterOptions(filters: FinCampFilters): Promise<{
  utmSource: string[];
  utmMedium: string[];
  utmCampaign: string[];
  utmContent: string[];
  utmTerm: string[];
  device: string[];
  city: string[];
  state: string[];
  carModel: string[];
  personType: string[];
  leadStatus: string[];
  creditStatus: string[];
  contractStatus: string[];
}> {
  const baseFilters = { ...filters, dateFrom: undefined, dateTo: undefined };
  const [events, clients] = await Promise.all([
    getEventsForFinCamp(baseFilters),
    getClientsForFinCamp(baseFilters),
  ]);

  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();

  return {
    utmSource: uniq([...events.map((e) => e.utm_source), ...clients.map((c) => c.utm_source)]),
    utmMedium: uniq([...events.map((e) => e.utm_medium), ...clients.map((c) => c.utm_medium)]),
    utmCampaign: uniq([...events.map((e) => e.utm_campaign), ...clients.map((c) => c.utm_campaign)]),
    utmContent: uniq([...(events.map((e) => e.utm_content).filter(Boolean)), ...(clients.map((c) => (c as any).utm_content).filter(Boolean))]),
    utmTerm: uniq([...(events.map((e) => e.utm_term).filter(Boolean)), ...(clients.map((c) => (c as any).utm_term).filter(Boolean))]),
    device: uniq(events.map((e) => e.device)),
    city: uniq(clients.map((c) => c.city)),
    state: uniq(clients.map((c) => c.state)),
    carModel: uniq(clients.map((c) => c.contract_vehicle).filter(Boolean)),
    personType: ["pf", "pj"],
    leadStatus: ["visitante", "lead", "qualificado", "proposta", "negociacao", "fechamento", "cliente"],
    creditStatus: ["pendente", "em_analise", "aprovado", "reprovado"],
    contractStatus: ["sem_contrato", "ativo", "renovacao_pendente", "cancelado", "encerrado"],
  };
}

/**
 * Calcula KPIs agregados para o período
 */
export async function getFinCampKPIs(filters: FinCampFilters): Promise<FinCampKPIs> {
  const [visitors, clients, events, docCount] = await Promise.all([
    getUniqueVisitors(filters),
    getClientsForFinCamp(filters),
    getEventsForFinCamp(filters),
    getDocumentsForFinCamp(filters),
  ]);

  const leads = clients.filter((c) => c.funnel_stage !== "visitante" || c.email || c.phone);
  const leadsCount = leads.length;
  const conversasIniciadas = events.filter((e) => ["whatsapp_click", "chatbot_opened", "chatbot_started"].includes(e.event_type)).length;
  const docsEnviados = docCount;
  const aprovados = clients.filter((c) => c.credit_status === "aprovado").length;
  const reprovados = clients.filter((c) => c.credit_status === "reprovado").length;
  const contratosGerados = clients.filter((c) => c.contract_status !== "sem_contrato").length;
  const contratosAssinados = clients.filter((c) => c.contract_status === "ativo" || c.contract_status === "renovacao_pendente").length;
  const entregasProgramadas = clients.filter((c) => c.contract_status === "ativo").length;

  const taxaVisitaLead = visitors > 0 ? (leadsCount / visitors) * 100 : 0;
  const taxaLeadDocumentos = leadsCount > 0 ? (docsEnviados / leadsCount) * 100 : 0;
  const taxaDocumentosAprovacao = docsEnviados > 0 ? (aprovados / docsEnviados) * 100 : 0;
  const taxaAprovacaoAssinatura = aprovados > 0 ? (contratosAssinados / aprovados) * 100 : 0;
  const taxaVisitaContrato = visitors > 0 ? (contratosAssinados / visitors) * 100 : 0;

  const receita = clients.reduce((s, c) => s + (c.contract_monthly || 0), 0);
  const ticketMedio = contratosAssinados > 0 ? receita / contratosAssinados : 0;

  return {
    visitantes: visitors,
    leadsGerados: leadsCount,
    conversasIniciadas: conversasIniciadas,
    documentosEnviados: docsEnviados,
    cadastrosAprovados: aprovados,
    cadastrosReprovados: reprovados,
    contratosGerados: contratosGerados,
    contratosAssinados: contratosAssinados,
    entregasProgramadas: entregasProgramadas,
    taxaVisitaLead,
    taxaLeadDocumentos,
    taxaDocumentosAprovacao,
    taxaAprovacaoAssinatura,
    taxaVisitaContrato,
    receitaGerada: receita,
    ticketMedio,
    receitaPorVisitante: visitors > 0 ? receita / visitors : 0,
    receitaPorLead: leadsCount > 0 ? receita / leadsCount : 0,
  };
}

/**
 * Funil completo com etapas e conversões
 */
export async function getFunnelData(filters: FinCampFilters): Promise<FunnelStep[]> {
  const [visitors, clients] = await Promise.all([
    getUniqueVisitors(filters),
    getClientsForFinCamp(filters),
  ]);

  const visitou = visitors;
  const virouLead = clients.filter((c) => c.funnel_stage !== "visitante" || c.email || c.phone).length;
  const docs = await getDocumentsForFinCamp(filters);
  const clientIds = clients.map((c) => c.id);
  const { data: docsData } = await supabase.from("client_documents").select("client_id").in("client_id", clientIds);
  const enviouDocs = new Set(docsData?.map((d) => d.client_id) ?? []).size;
  const emAnalise = clients.filter((c) => c.credit_status === "em_analise").length;
  const aprovado = clients.filter((c) => c.credit_status === "aprovado").length;
  const reprovado = clients.filter((c) => c.credit_status === "reprovado").length;
  const contratoGerado = clients.filter((c) => c.contract_status !== "sem_contrato").length;
  const contratosAssinados = clients.filter((c) => c.contract_status === "ativo" || c.contract_status === "renovacao_pendente").length;
  const entregaProgramada = clients.filter((c) => c.contract_status === "ativo").length;

  const steps: FunnelStep[] = [
    { label: "Visitou o site", count: visitou, conversionFromPrev: 100, lossFromPrev: 0 },
    { label: "Virou lead", count: virouLead, conversionFromPrev: visitou ? (virouLead / visitou) * 100 : 0, lossFromPrev: visitou ? 100 - (virouLead / visitou) * 100 : 0 },
    { label: "Iniciou conversa", count: virouLead, conversionFromPrev: 100, lossFromPrev: 0 },
    { label: "Selecionou interesse", count: virouLead, conversionFromPrev: 100, lossFromPrev: 0 },
    { label: "Enviou documentos", count: enviouDocs, conversionFromPrev: virouLead ? (enviouDocs / virouLead) * 100 : 0, lossFromPrev: virouLead ? 100 - (enviouDocs / virouLead) * 100 : 0 },
    { label: "Entrou em análise", count: emAnalise ? enviouDocs : enviouDocs, conversionFromPrev: enviouDocs ? 100 : 0, lossFromPrev: 0 },
    { label: "Foi aprovado", count: aprovado, conversionFromPrev: enviouDocs ? (aprovado / enviouDocs) * 100 : 0, lossFromPrev: enviouDocs ? 100 - (aprovado / enviouDocs) * 100 : 0 },
    { label: "Foi reprovado", count: reprovado, conversionFromPrev: 0, lossFromPrev: 0 },
    { label: "Contrato gerado", count: contratoGerado, conversionFromPrev: aprovado ? (contratoGerado / aprovado) * 100 : 0, lossFromPrev: aprovado ? 100 - (contratoGerado / aprovado) * 100 : 0 },
    { label: "Contrato assinado", count: contratosAssinados, conversionFromPrev: contratoGerado ? (contratosAssinados / contratoGerado) * 100 : 0, lossFromPrev: contratoGerado ? 100 - (contratosAssinados / contratoGerado) * 100 : 0 },
    { label: "Entrega programada", count: entregaProgramada, conversionFromPrev: contratosAssinados ? (entregaProgramada / contratosAssinados) * 100 : 0, lossFromPrev: contratosAssinados ? 100 - (entregaProgramada / contratosAssinados) * 100 : 0 },
  ];
  return steps;
}

/**
 * Dados para gráficos por UTM
 */
export async function getLeadsByUtmSource(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const clients = await getClientsForFinCamp(filters);
  const leads = clients.filter((c) => c.funnel_stage !== "visitante" || c.email || c.phone);
  const bySource: Record<string, number> = {};
  leads.forEach((c) => {
    const s = c.utm_source || "(sem source)";
    bySource[s] = (bySource[s] || 0) + 1;
  });
  return Object.entries(bySource).map(([name, value]) => ({ name, value }));
}

export async function getLeadsByUtmCampaign(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const clients = await getClientsForFinCamp(filters);
  const leads = clients.filter((c) => c.funnel_stage !== "visitante" || c.email || c.phone);
  const byCampaign: Record<string, number> = {};
  leads.forEach((c) => {
    const s = c.utm_campaign || "(sem campanha)";
    byCampaign[s] = (byCampaign[s] || 0) + 1;
  });
  return Object.entries(byCampaign).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
}

export async function getContratosByUtmCampaign(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const clients = await getClientsForFinCamp(filters);
  const assinados = clients.filter((c) => c.contract_status === "ativo" || c.contract_status === "renovacao_pendente");
  const byCampaign: Record<string, number> = {};
  assinados.forEach((c) => {
    const s = c.utm_campaign || "(sem campanha)";
    byCampaign[s] = (byCampaign[s] || 0) + 1;
  });
  return Object.entries(byCampaign).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
}

export async function getReceitaByUtmCampaign(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const clients = await getClientsForFinCamp(filters);
  const assinados = clients.filter((c) => c.contract_status === "ativo" || c.contract_status === "renovacao_pendente");
  const byCampaign: Record<string, number> = {};
  assinados.forEach((c) => {
    const s = c.utm_campaign || "(sem campanha)";
    byCampaign[s] = (byCampaign[s] || 0) + (c.contract_monthly || 0);
  });
  return Object.entries(byCampaign).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
}

/**
 * Visitantes por página de entrada
 */
export async function getVisitorsByLandingPage(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const events = await getEventsForFinCamp(filters);
  const pageviews = events.filter((e) => e.event_type === "pageview");
  const firstByVisitor = new Map<string, string>();
  pageviews.forEach((e) => {
    if (!firstByVisitor.has(e.visitor_id)) {
      firstByVisitor.set(e.visitor_id, e.page_url || "/");
    }
  });
  const byPage: Record<string, number> = {};
  firstByVisitor.forEach((url) => {
    const page = url.split("?")[0] || "/";
    byPage[page] = (byPage[page] || 0) + 1;
  });
  return Object.entries(byPage).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
}

/**
 * Tempo médio por campanha (mock - eventos não têm campanha por sessão completa)
 */
export async function getAvgTimeByCampaign(filters: FinCampFilters): Promise<ChartDataPoint[]> {
  const events = await getEventsForFinCamp(filters);
  const byCampaign: Record<string, number[]> = {};
  events.forEach((e) => {
    const c = e.utm_campaign || "(sem campanha)";
    if (!byCampaign[c]) byCampaign[c] = [];
    if (e.duration_seconds > 0) byCampaign[c].push(e.duration_seconds);
  });
  return Object.entries(byCampaign).map(([name, arr]) => ({
    name,
    value: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
  })).sort((a, b) => b.value - a.value).slice(0, 10);
}

/**
 * Tabela detalhada de leads
 */
export async function getFinCampLeadsTable(
  filters: FinCampFilters,
  opts: { limit: number; offset: number }
): Promise<{ rows: FinCampLeadRow[]; total: number }> {
  let q = supabase.from("clients").select("*", { count: "exact" });
  if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
  if (filters.dateTo) q = q.lte("created_at", filters.dateTo + "T23:59:59.999Z");
  if (filters.utmSource?.length) q = q.in("utm_source", filters.utmSource.map(mapEmpty));
  if (filters.utmMedium?.length) q = q.in("utm_medium", filters.utmMedium.map(mapEmpty));
  if (filters.utmCampaign?.length) q = q.in("utm_campaign", filters.utmCampaign.map(mapEmpty));
  if (filters.personType?.length) q = q.in("person_type", filters.personType);
  if (filters.leadStatus?.length) q = q.in("funnel_stage", filters.leadStatus);
  if (filters.creditStatus?.length) q = q.in("credit_status", filters.creditStatus);
  if (filters.contractStatus?.length) q = q.in("contract_status", filters.contractStatus);
  if (filters.state?.length) q = q.in("state", filters.state);
  if (filters.city?.length) q = q.in("city", filters.city);
  if (filters.carModel?.length) {
    const or = filters.carModel.map((m) => `contract_vehicle.ilike.%${m}%`).join(",");
    q = q.or(or);
  }

  const { data, count } = await q
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);
  const clients = data ?? [];

  const rows: FinCampLeadRow[] = clients.map((c) => {
    const name = c.person_type === "pj" ? (c.trade_name || c.company_name) : c.full_name;
    const signedAt = c.contract_status === "ativo" || c.contract_status === "renovacao_pendente" ? c.updated_at : null;
    const created = new Date(c.created_at).getTime();
    const updated = signedAt ? new Date(signedAt).getTime() : created;
    const timeToConversion = signedAt ? Math.round((updated - created) / 60000) : 0;
    return {
      id: c.id,
      date: c.created_at,
      name,
      phone: c.phone || "",
      email: c.email || "",
      utmSource: c.utm_source || "",
      utmMedium: c.utm_medium || "",
      utmCampaign: c.utm_campaign || "",
      utmContent: (c as any).utm_content || "",
      utmTerm: (c as any).utm_term || "",
      landingPage: "",
      device: "",
      city: c.city || "",
      state: c.state || "",
      carModel: c.contract_vehicle || "",
      leadStatus: c.funnel_stage || "",
      creditStatus: c.credit_status || "",
      contractStatus: c.contract_status || "",
      signedAt,
      revenue: c.contract_monthly || 0,
      timeToConversion,
    };
  });

  return { rows, total: count ?? 0 };
}
