import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, Client, ClientDocument, ClientTrackingEvent } from "@/services/api";
import {
  Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight,
  User, Building2, FileText, Eye, Upload, Download, X, Save, Activity,
} from "lucide-react";

const FUNNEL_LABELS: Record<string, string> = {
  visitante: "Visitante",
  lead: "Lead",
  qualificado: "Qualificado",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechamento: "Fechamento",
  cliente: "Cliente",
};

const FUNNEL_COLORS: Record<string, string> = {
  visitante: "bg-slate-100 text-slate-600",
  lead: "bg-blue-100 text-blue-700",
  qualificado: "bg-indigo-100 text-indigo-700",
  proposta: "bg-purple-100 text-purple-700",
  negociacao: "bg-amber-100 text-amber-700",
  fechamento: "bg-orange-100 text-orange-700",
  cliente: "bg-green-100 text-green-700",
};

const CREDIT_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

const CREDIT_COLORS: Record<string, string> = {
  pendente: "bg-slate-100 text-slate-600",
  em_analise: "bg-yellow-100 text-yellow-700",
  aprovado: "bg-green-100 text-green-700",
  reprovado: "bg-red-100 text-red-600",
};

const CONTRACT_LABELS: Record<string, string> = {
  sem_contrato: "Sem Contrato",
  ativo: "Ativo",
  renovacao_pendente: "Renovação Pendente",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
};

const DOC_TYPES_PF: Record<string, string> = {
  cnh: "CNH",
  comprovante_endereco: "Comprovante de Endereço",
  comprovante_renda: "Comprovante de Renda",
};

const DOC_TYPES_PJ: Record<string, string> = {
  contrato_social: "Contrato Social + Alteração Contratual",
  dre_balanco: "DRE + Balanço (2 anos)",
  rr_simples_irpj: "Relação de Rendimentos + Simples + IRPJ (optante Simples)",
};

const STATES_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const PAGE_SIZE = 20;

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function DocDownloadLink({ doc }: { doc: ClientDocument }) {
  const handleClick = async () => {
    const url = doc.file_url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank");
      return;
    }
    try {
      const signed = await api.getClientDocSignedUrl(url);
      if (signed) window.open(signed, "_blank");
    } catch (e: any) { alert(e.message); }
  };
  return (
    <button type="button" onClick={handleClick} className="text-blue-600 hover:text-blue-800 p-1" title="Baixar">
      <Download size={16} />
    </button>
  );
}

/* ─── Main Component ─── */

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterFunnel, setFilterFunnel] = useState("");
  const [filterCredit, setFilterCredit] = useState("");
  const [filterContract, setFilterContract] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getClients({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: search || undefined,
        funnelStage: filterFunnel || undefined,
        creditStatus: filterCredit || undefined,
        contractStatus: filterContract || undefined,
        personType: filterType || undefined,
      });
      setClients(r.rows);
      setTotal(r.total);
    } catch {}
    setLoading(false);
  }, [page, search, filterFunnel, filterCredit, filterContract, filterType]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (selected) {
    return <ClientDetail client={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  if (showForm) {
    return (
      <ClientForm
        onSave={async (data) => {
          if (data?.id) {
            setSelected(data as Client);
            setShowForm(false);
          } else {
            setShowForm(false);
            load();
          }
        }}
        onCancel={() => { setShowForm(false); load(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{total} cliente(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-1" /> Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            placeholder="Buscar nome, email, CPF, CNPJ, telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }}>
          <option value="">Todos os tipos</option>
          <option value="pf">Pessoa Física</option>
          <option value="pj">Pessoa Jurídica</option>
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterFunnel} onChange={(e) => { setFilterFunnel(e.target.value); setPage(0); }}>
          <option value="">Todos os funis</option>
          {Object.entries(FUNNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterCredit} onChange={(e) => { setFilterCredit(e.target.value); setPage(0); }}>
          <option value="">Todos os créditos</option>
          {Object.entries(CREDIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterContract} onChange={(e) => { setFilterContract(e.target.value); setPage(0); }}>
          <option value="">Todos os contratos</option>
          {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Nenhum cliente encontrado</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome / Empresa</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Contato</th>
                <th className="text-left px-4 py-3 font-medium">Funil</th>
                <th className="text-center px-4 py-3 font-medium">Proximidade</th>
                <th className="text-left px-4 py-3 font-medium">Crédito</th>
                <th className="text-left px-4 py-3 font-medium">Contrato</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {c.person_type === "pj" ? (c.trade_name || c.company_name) : c.full_name}
                    </div>
                    {c.person_type === "pj" && c.responsible_name && (
                      <div className="text-xs text-slate-400">{c.responsible_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      {c.person_type === "pf" ? <User size={12} /> : <Building2 size={12} />}
                      {c.person_type === "pf" ? "PF" : "PJ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{c.email}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${FUNNEL_COLORS[c.funnel_stage] ?? ""}`}>
                      {FUNNEL_LABELS[c.funnel_stage] ?? c.funnel_stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.purchase_proximity}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{c.purchase_proximity}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CREDIT_COLORS[c.credit_status] ?? ""}`}>
                      {CREDIT_LABELS[c.credit_status] ?? c.credit_status}
                    </span>
                    {c.credit_status === "aprovado" && c.credit_amount > 0 && (
                      <div className="text-xs text-green-600 mt-0.5">{fmtCurrency(c.credit_amount)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{CONTRACT_LABELS[c.contract_status] ?? c.contract_status}</span>
                    {c.contract_end && (
                      <div className="text-xs text-slate-400">Até {fmtDate(c.contract_end)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} /> Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Próxima <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Client Detail View ─── */

function ClientDetail({ client: initial, onBack }: { client: Client; onBack: () => void }) {
  const [client, setClient] = useState(initial);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [events, setEvents] = useState<ClientTrackingEvent[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const docTypes = client.person_type === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF;
  const [uploadDocType, setUploadDocType] = useState(Object.keys(docTypes)[0] ?? "cnh");
  const [uploadPageCount, setUploadPageCount] = useState(1);

  useEffect(() => {
    setUploadDocType((prev) => (docTypes[prev] ? prev : Object.keys(docTypes)[0] ?? "cnh"));
  }, [client.person_type]);

  useEffect(() => {
    api.getClientDocuments(client.id).then(setDocs).catch(() => {});
    api.getClientEvents(client.id).then(setEvents).catch(() => {});
  }, [client.id]);
  const totalPages = docs.reduce((s, d) => s + (d.page_count ?? 1), 0);

  const handleSave = async (data: Partial<Client>) => {
    setSaving(true);
    try {
      await api.updateClient(client.id, data);
      const updated = await api.getClient(client.id);
      setClient(updated);
      setEditing(false);
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    const name = client.person_type === "pj" ? (client.trade_name || client.company_name) : client.full_name;
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await api.deleteClient(client.id, name);
      onBack();
    } catch (e: any) { alert(e.message); }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pages = Math.max(1, Math.min(30, uploadPageCount));
    if (totalPages + pages > 30) {
      alert("Limite de 30 páginas. Total atual: " + totalPages + ". Reduza o número de páginas ou remova documentos.");
      e.target.value = "";
      return;
    }
    try {
      const path = await api.uploadClientDoc(client.id, file);
      const doc = await api.createClientDocument({
        client_id: client.id,
        doc_type: uploadDocType,
        doc_name: file.name,
        file_url: path,
        page_count: pages,
      });
      setDocs([doc, ...docs]);
    } catch (err: any) { alert(err.message); }
    e.target.value = "";
  };

  const handleDocDelete = async (doc: ClientDocument) => {
    if (!confirm(`Excluir "${doc.doc_name}"?`)) return;
    try {
      await api.deleteClientDocument(doc.id);
      setDocs(docs.filter((d) => d.id !== doc.id));
    } catch (e: any) { alert(e.message); }
  };

  const handleDocStatus = async (doc: ClientDocument, status: string) => {
    try {
      await api.updateClientDocument(doc.id, { status: status as any });
      setDocs(docs.map((d) => d.id === doc.id ? { ...d, status: status as any } : d));
    } catch (e: any) { alert(e.message); }
  };

  const displayName = client.person_type === "pj" ? (client.trade_name || client.company_name) : client.full_name;

  if (editing) {
    return (
      <ClientForm
        initial={client}
        onSave={async (data) => { await handleSave(data); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft size={20} /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
          <p className="text-sm text-slate-500">{client.person_type === "pf" ? "Pessoa Física" : "Pessoa Jurídica"} — Cadastro {fmtDate(client.created_at)}</p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}><Pencil size={14} className="mr-1" /> Editar</Button>
        <Button variant="outline" className="text-red-500" onClick={handleDelete}><Trash2 size={14} className="mr-1" /> Excluir</Button>
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="flex-wrap h-auto gap-1 overflow-x-auto">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1">
            <FileText size={14} /> Documentos ({docs.length})
          </TabsTrigger>
          <TabsTrigger value="credito">Crédito</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="tracking">Tracking ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="bg-white rounded-lg border p-6 mt-4">
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-blue-50 text-blue-800 text-sm">
            <FileText size={18} className="shrink-0" />
            <span>
              Para enviar documentos (CNH, comprovantes, etc.) para análise de cadastro, acesse a aba <strong>Documentos</strong> acima.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {client.person_type === "pf" ? (
              <>
                <Field label="CPF" value={client.cpf} />
                <Field label="RG" value={client.rg} />
                <Field label="Nascimento" value={fmtDate(client.birth_date)} />
                <Field label="Estado Civil" value={client.marital_status} />
                <Field label="Profissão" value={client.occupation} />
                <Field label="Renda Mensal" value={fmtCurrency(client.monthly_income)} />
              </>
            ) : (
              <>
                <Field label="Razão Social" value={client.company_name} />
                <Field label="Nome Fantasia" value={client.trade_name} />
                <Field label="CNPJ" value={client.cnpj} />
                <Field label="Inscrição Estadual" value={client.state_registration} />
                <Field label="Signatário" value={client.responsible_name} />
                <Field label="CPF Signatário" value={client.responsible_cpf} />
                <Field label="Nascimento Signatário" value={fmtDate(client.responsible_birth_date)} />
                <Field label="Estado Civil" value={client.responsible_marital_status} />
                <Field label="Profissão" value={client.responsible_occupation} />
                <Field label="Cor Desejada" value={client.desired_color} />
                <Field label="Cidade Entrega" value={client.delivery_city} />
                <Field label="Estado Entrega" value={client.delivery_state} />
              </>
            )}
            <Field label="Email" value={client.email} />
            <Field label="Telefone" value={client.phone} />
            <Field label="Telefone 2" value={client.phone2} />
            <div className="md:col-span-3 border-t pt-3 mt-2">
              <p className="text-xs font-medium text-slate-500 mb-2">Endereço</p>
            </div>
            <Field label="CEP" value={client.zip_code} />
            <Field label="Rua" value={client.street} />
            <Field label="Número" value={client.street_number} />
            <Field label="Complemento" value={client.complement} />
            <Field label="Bairro" value={client.neighborhood} />
            <Field label="Cidade" value={client.city} />
            <Field label="Estado" value={client.state} />
            <div className="md:col-span-3 border-t pt-3 mt-2">
              <p className="text-xs font-medium text-slate-500 mb-2">Funil de Vendas</p>
            </div>
            <Field label="Etapa" value={FUNNEL_LABELS[client.funnel_stage] ?? client.funnel_stage} />
            <Field label="Proximidade da Compra" value={`${client.purchase_proximity}%`} />
            <Field label="Cadastro Parcial" value={client.is_partial ? "Sim" : "Não"} />
            <div className="md:col-span-3 border-t pt-3 mt-2">
              <p className="text-xs font-medium text-slate-500 mb-2">Origem / UTM</p>
            </div>
            <Field label="Origem (source)" value={client.utm_source} />
            <Field label="Meio (medium)" value={client.utm_medium} />
            <Field label="Campanha" value={client.utm_campaign} />
            <Field label="Referrer" value={client.referrer} />
            {client.notes && (
              <div className="md:col-span-3 border-t pt-3 mt-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="credito" className="bg-white rounded-lg border p-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${CREDIT_COLORS[client.credit_status]}`}>
                {CREDIT_LABELS[client.credit_status]}
              </span>
            </div>
            <Field label="Valor Aprovado" value={fmtCurrency(client.credit_amount)} />
            <Field label="Data da Análise" value={fmtDate(client.credit_analysis_date)} />
            {client.credit_notes && (
              <div className="md:col-span-3">
                <p className="text-xs text-slate-500">Observações do Crédito</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{client.credit_notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contrato" className="bg-white rounded-lg border p-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Field label="Status" value={CONTRACT_LABELS[client.contract_status] ?? client.contract_status} />
            <Field label="Veículo" value={client.contract_vehicle} />
            <Field label="Mensalidade" value={fmtCurrency(client.contract_monthly)} />
            <Field label="Início" value={fmtDate(client.contract_start)} />
            <Field label="Fim" value={fmtDate(client.contract_end)} />
            {client.contract_end && (
              <Field label="Renovação em" value={(() => {
                const diff = Math.ceil((new Date(client.contract_end).getTime() - Date.now()) / 86400000);
                return diff > 0 ? `${diff} dias` : "Vencido";
              })()} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="bg-white rounded-lg border p-6 mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select className="px-3 py-2 border rounded-lg text-sm" value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)}>
                {Object.entries(docTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Páginas</label>
              <input type="number" min={1} max={30} className="w-20 px-3 py-2 border rounded-lg text-sm" value={uploadPageCount} onChange={(e) => setUploadPageCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
            </div>
            <div className="text-sm text-slate-500">Total: {totalPages}/30 páginas</div>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,application/pdf,.jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleDocUpload} />
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Upload size={14} /> Enviar Documento
              </span>
            </label>
          </div>
          {totalPages > 30 && <p className="text-amber-600 text-sm">Atenção: total de páginas excede o limite de 30.</p>}
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum documento enviado</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                  <FileText size={18} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.doc_name}</p>
                    <p className="text-xs text-slate-400">
                      {(client.person_type === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF)[doc.doc_type] ?? doc.doc_type} • {doc.page_count ?? 1} pág. • {fmtDateTime(doc.created_at)}
                    </p>
                  </div>
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={doc.status}
                    onChange={(e) => handleDocStatus(doc, e.target.value)}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="reprovado">Reprovado</option>
                  </select>
                  <DocDownloadLink doc={doc} />
                  <button className="text-red-400 hover:text-red-600" onClick={() => handleDocDelete(doc)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="bg-white rounded-lg border p-6 mt-4">
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum evento registrado</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm">
                  <Activity size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ev.event_type}</span>
                      <span className="text-xs text-slate-400">{fmtDateTime(ev.created_at)}</span>
                    </div>
                    {ev.page_url && <p className="text-xs text-slate-500 truncate">{ev.page_url}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 mt-1">
                      {ev.device && <span>Dispositivo: {ev.device}</span>}
                      {ev.browser && <span>Navegador: {ev.browser}</span>}
                      {ev.os && <span>SO: {ev.os}</span>}
                      {ev.duration_seconds > 0 && <span>Duração: {ev.duration_seconds}s</span>}
                      {ev.utm_source && <span>UTM: {ev.utm_source}/{ev.utm_medium}/{ev.utm_campaign}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Reusable Field ─── */

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{value || "—"}</p>
    </div>
  );
}

/* ─── Client Form (Create / Edit) ─── */

function ClientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Client;
  onSave: (data: Partial<Client> & { id?: string }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [personType, setPersonType] = useState<"pf" | "pj">(initial?.person_type ?? "pf");
  const [saving, setSaving] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [uploadDocType, setUploadDocType] = useState("cnh");
  const [uploadPageCount, setUploadPageCount] = useState(1);

  const docTypes = personType === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF;
  const totalPages = docs.reduce((s, d) => s + (d.page_count ?? 1), 0);

  const [f, setF] = useState({
    full_name: initial?.full_name ?? "",
    cpf: initial?.cpf ?? "",
    rg: initial?.rg ?? "",
    birth_date: initial?.birth_date ?? "",
    marital_status: initial?.marital_status ?? "",
    occupation: initial?.occupation ?? "",
    monthly_income: initial?.monthly_income ?? 0,
    company_name: initial?.company_name ?? "",
    trade_name: initial?.trade_name ?? "",
    cnpj: initial?.cnpj ?? "",
    state_registration: initial?.state_registration ?? "",
    responsible_name: initial?.responsible_name ?? "",
    responsible_cpf: initial?.responsible_cpf ?? "",
    responsible_role: initial?.responsible_role ?? "",
    responsible_birth_date: initial?.responsible_birth_date ?? "",
    responsible_marital_status: initial?.responsible_marital_status ?? "",
    responsible_occupation: initial?.responsible_occupation ?? "",
    delivery_city: initial?.delivery_city ?? "",
    delivery_state: initial?.delivery_state ?? "",
    desired_color: initial?.desired_color ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    phone2: initial?.phone2 ?? "",
    zip_code: initial?.zip_code ?? "",
    street: initial?.street ?? "",
    street_number: initial?.street_number ?? "",
    complement: initial?.complement ?? "",
    neighborhood: initial?.neighborhood ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    credit_status: initial?.credit_status ?? "pendente",
    credit_amount: initial?.credit_amount ?? 0,
    credit_analysis_date: initial?.credit_analysis_date ?? "",
    credit_notes: initial?.credit_notes ?? "",
    contract_start: initial?.contract_start ?? "",
    contract_end: initial?.contract_end ?? "",
    contract_status: initial?.contract_status ?? "sem_contrato",
    contract_vehicle: initial?.contract_vehicle ?? "",
    contract_monthly: initial?.contract_monthly ?? 0,
    funnel_stage: initial?.funnel_stage ?? "visitante",
    purchase_proximity: initial?.purchase_proximity ?? 0,
    utm_source: initial?.utm_source ?? "",
    utm_medium: initial?.utm_medium ?? "",
    utm_campaign: initial?.utm_campaign ?? "",
    referrer: initial?.referrer ?? "",
    notes: initial?.notes ?? "",
    is_partial: initial?.is_partial ?? true,
  });

  const set = (key: string, val: string | number | boolean) => setF((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    const types = personType === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF;
    setUploadDocType((prev) => (types[prev] ? prev : Object.keys(types)[0] ?? "cnh"));
  }, [personType]);

  useEffect(() => {
    if (createdClient?.id) {
      api.getClientDocuments(createdClient.id).then(setDocs).catch(() => {});
    }
  }, [createdClient?.id]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !createdClient) return;
    const pages = Math.max(1, Math.min(30, uploadPageCount));
    if (totalPages + pages > 30) {
      alert("Limite de 30 páginas. Total atual: " + totalPages + ". Reduza o número de páginas ou remova documentos.");
      e.target.value = "";
      return;
    }
    try {
      const path = await api.uploadClientDoc(createdClient.id, file);
      const doc = await api.createClientDocument({
        client_id: createdClient.id,
        doc_type: uploadDocType,
        doc_name: file.name,
        file_url: path,
        page_count: pages,
      });
      setDocs([doc, ...docs]);
    } catch (err: any) { alert(err.message); }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({ person_type: personType, ...f });
      } else {
        const created = await api.createClient({ person_type: personType, ...f } as any);
        setCreatedClient(created);
      }
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  if (createdClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => onSave(createdClient)}><ChevronLeft size={20} /></Button>
          <h1 className="text-2xl font-bold text-slate-900">Documentos do Cliente</h1>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          <span>✓ Cliente cadastrado com sucesso. Envie os documentos abaixo para análise de cadastro.</span>
        </div>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select className="px-3 py-2 border rounded-lg text-sm" value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)}>
                {Object.entries(docTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Páginas</label>
              <input type="number" min={1} max={30} className="w-20 px-3 py-2 border rounded-lg text-sm" value={uploadPageCount} onChange={(e) => setUploadPageCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
            </div>
            <div className="text-sm text-slate-500">Total: {totalPages}/30 páginas</div>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,application/pdf,.jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleDocUpload} />
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Upload size={14} /> Enviar Documento
              </span>
            </label>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum documento enviado</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                  <FileText size={18} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.doc_name}</p>
                    <p className="text-xs text-slate-400">{docTypes[doc.doc_type] ?? doc.doc_type} • {doc.page_count ?? 1} pág.</p>
                  </div>
                  <DocDownloadLink doc={doc} />
                  <button className="text-red-400 hover:text-red-600" onClick={async () => {
                    if (!confirm(`Excluir "${doc.doc_name}"?`)) return;
                    try {
                      await api.deleteClientDocument(doc.id);
                      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
                    } catch (e: any) { alert(e.message); }
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(createdClient)}>
            Concluir e ver cadastro
          </Button>
          <Button variant="outline" onClick={onCancel}>Voltar à lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ChevronLeft size={20} /></Button>
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Editar Cliente" : "Novo Cliente"}</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Pessoa</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={personType === "pf"} onChange={() => setPersonType("pf")} />
              <User size={16} /> Pessoa Física
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={personType === "pj"} onChange={() => setPersonType("pj")} />
              <Building2 size={16} /> Pessoa Jurídica
            </label>
          </div>
        </div>

        {/* PF Fields */}
        {personType === "pf" && (
          <Section title="Dados Pessoais">
            <Input label="Nome Completo *" value={f.full_name} onChange={(v) => set("full_name", v)} />
            <Input label="CPF" value={f.cpf} onChange={(v) => set("cpf", v)} placeholder="000.000.000-00" />
            <Input label="RG" value={f.rg} onChange={(v) => set("rg", v)} />
            <Input label="Data de Nascimento" value={f.birth_date} onChange={(v) => set("birth_date", v)} type="date" />
            <Input label="Estado Civil" value={f.marital_status} onChange={(v) => set("marital_status", v)} />
            <Input label="Profissão" value={f.occupation} onChange={(v) => set("occupation", v)} />
            <Input label="Renda Mensal" value={String(f.monthly_income)} onChange={(v) => set("monthly_income", Number(v))} type="number" />
          </Section>
        )}

        {/* PJ Fields */}
        {personType === "pj" && (
          <Section title="Dados Empresariais (Canal Indireto)">
            <Input label="Razão Social *" value={f.company_name} onChange={(v) => set("company_name", v)} />
            <Input label="Nome Fantasia" value={f.trade_name} onChange={(v) => set("trade_name", v)} />
            <Input label="CNPJ" value={f.cnpj} onChange={(v) => set("cnpj", v)} placeholder="00.000.000/0000-00" />
            <Input label="Inscrição Estadual" value={f.state_registration} onChange={(v) => set("state_registration", v)} />
            <Input label="Nome Completo do Signatário" value={f.responsible_name} onChange={(v) => set("responsible_name", v)} placeholder="Pessoa que vai assinar o contrato" />
            <Input label="CPF do Signatário" value={f.responsible_cpf} onChange={(v) => set("responsible_cpf", v)} />
            <Input label="Data de Nascimento do Signatário" value={f.responsible_birth_date ?? ""} onChange={(v) => set("responsible_birth_date", v)} type="date" />
            <Input label="Estado Civil" value={f.responsible_marital_status ?? ""} onChange={(v) => set("responsible_marital_status", v)} />
            <Input label="Profissão" value={f.responsible_occupation ?? ""} onChange={(v) => set("responsible_occupation", v)} />
            <Input label="Cor Desejada" value={f.desired_color ?? ""} onChange={(v) => set("desired_color", v)} />
            <Input label="Cidade para Entrega" value={f.delivery_city ?? ""} onChange={(v) => set("delivery_city", v)} placeholder="Cidade e estado para entrega do carro" />
            <Input label="Estado para Entrega" value={f.delivery_state ?? ""} onChange={(v) => set("delivery_state", v)} />
          </Section>
        )}

        {/* Contact */}
        <Section title="Contato">
          <Input label="Email" value={f.email} onChange={(v) => set("email", v)} type="email" />
          <Input label="Telefone" value={f.phone} onChange={(v) => set("phone", v)} />
          <Input label="Telefone 2" value={f.phone2} onChange={(v) => set("phone2", v)} />
        </Section>

        {/* Address */}
        <Section title="Endereço">
          <Input label="CEP" value={f.zip_code} onChange={(v) => set("zip_code", v)} />
          <Input label="Rua" value={f.street} onChange={(v) => set("street", v)} className="md:col-span-2" />
          <Input label="Número" value={f.street_number} onChange={(v) => set("street_number", v)} />
          <Input label="Complemento" value={f.complement} onChange={(v) => set("complement", v)} />
          <Input label="Bairro" value={f.neighborhood} onChange={(v) => set("neighborhood", v)} />
          <Input label="Cidade" value={f.city} onChange={(v) => set("city", v)} />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={f.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Selecione</option>
              {STATES_BR.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Section>

        {/* Funnel */}
        <Section title="Funil de Vendas">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Etapa do Funil</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={f.funnel_stage} onChange={(e) => set("funnel_stage", e.target.value)}>
              {Object.entries(FUNNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Proximidade da Compra ({f.purchase_proximity}%)</label>
            <input
              type="range"
              min={0} max={100}
              className="w-full"
              value={f.purchase_proximity}
              onChange={(e) => set("purchase_proximity", Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={f.is_partial} onChange={(e) => set("is_partial", e.target.checked)} id="partial" />
            <label htmlFor="partial" className="text-sm">Cadastro parcial (cliente não concluiu compra)</label>
          </div>
        </Section>

        {/* Credit */}
        <Section title="Crédito">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={f.credit_status} onChange={(e) => set("credit_status", e.target.value)}>
              {Object.entries(CREDIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Input label="Valor Aprovado" value={String(f.credit_amount)} onChange={(v) => set("credit_amount", Number(v))} type="number" />
          <Input label="Data da Análise" value={f.credit_analysis_date} onChange={(v) => set("credit_analysis_date", v)} type="date" />
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Observações do Crédito</label>
            <textarea className="w-full px-3 py-2 border rounded-lg text-sm h-20" value={f.credit_notes} onChange={(e) => set("credit_notes", e.target.value)} />
          </div>
        </Section>

        {/* Contract */}
        <Section title="Contrato">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm" value={f.contract_status} onChange={(e) => set("contract_status", e.target.value)}>
              {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Input label="Veículo" value={f.contract_vehicle} onChange={(v) => set("contract_vehicle", v)} />
          <Input label="Mensalidade" value={String(f.contract_monthly)} onChange={(v) => set("contract_monthly", Number(v))} type="number" />
          <Input label="Início" value={f.contract_start} onChange={(v) => set("contract_start", v)} type="date" />
          <Input label="Fim" value={f.contract_end} onChange={(v) => set("contract_end", v)} type="date" />
        </Section>

        {/* UTM */}
        <Section title="Origem / UTM">
          <Input label="UTM Source" value={f.utm_source} onChange={(v) => set("utm_source", v)} />
          <Input label="UTM Medium" value={f.utm_medium} onChange={(v) => set("utm_medium", v)} />
          <Input label="UTM Campaign" value={f.utm_campaign} onChange={(v) => set("utm_campaign", v)} />
          <Input label="Referrer" value={f.referrer} onChange={(v) => set("referrer", v)} />
        </Section>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observações Gerais</label>
          <textarea className="w-full px-3 py-2 border rounded-lg text-sm h-24" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={saving}>
            <Save size={16} className="mr-1" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            <X size={16} className="mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Form Helpers ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text", placeholder = "", className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        className="w-full px-3 py-2 border rounded-lg text-sm"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
