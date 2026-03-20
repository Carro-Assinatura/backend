import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  Building2,
  FileText,
  Upload,
  Check,
  ArrowLeft,
} from "lucide-react";
import { publicClientApi } from "@/services/api";
import type { Client, ClientDocument } from "@/services/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string | number) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && "*"}
      </label>
      <input
        className="w-full px-3 py-2 border rounded-lg text-sm"
        type={type}
        value={String(value ?? "")}
        onChange={(e) => {
          const v = e.target.value;
          onChange(type === "number" ? (v ? Number(v) : 0) : v);
        }}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default function CadastroPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    car?: string;
    variant?: { marca: string; modelo_carro: string; categoria: string; franquia_km_mes: string; prazo_contrato: string; formattedPrice: string };
  } | null;

  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [saving, setSaving] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [uploadDocType, setUploadDocType] = useState("cnh");
  const [uploadPageCount, setUploadPageCount] = useState(1);
  const [concluded, setConcluded] = useState(false);

  const docTypes = personType === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF;
  const totalPages = docs.reduce((s, d) => s + (d.page_count ?? 1), 0);

  const [f, setF] = useState({
    full_name: "",
    cpf: "",
    rg: "",
    birth_date: "",
    marital_status: "",
    occupation: "",
    monthly_income: 0,
    company_name: "",
    trade_name: "",
    cnpj: "",
    state_registration: "",
    responsible_name: "",
    responsible_cpf: "",
    responsible_role: "",
    responsible_birth_date: "",
    responsible_marital_status: "",
    responsible_occupation: "",
    delivery_city: "",
    delivery_state: "",
    desired_color: "",
    email: "",
    phone: "",
    phone2: "",
    zip_code: "",
    street: "",
    street_number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    contract_vehicle: state?.car ?? "",
    contract_monthly: 0,
    funnel_stage: "lead" as const,
    purchase_proximity: 50,
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    notes: "",
    is_partial: true,
  });

  useEffect(() => {
    if (state?.car) setF((p) => ({ ...p, contract_vehicle: state.car }));
    if (state?.variant) {
      setF((p) => ({
        ...p,
        contract_vehicle: state.car ?? p.contract_vehicle,
        contract_monthly: parseFloat(
          state.variant.formattedPrice.replace(/[R$\s.]/g, "").replace(",", ".")
        ) || 0,
        notes: `Interesse: ${state.variant.marca} ${state.variant.modelo_carro} - ${state.variant.categoria} - ${state.variant.franquia_km_mes} - ${state.variant.prazo_contrato} - ${state.variant.formattedPrice}`,
      }));
    }
  }, [state]);

  const set = (key: string, val: string | number | boolean) =>
    setF((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    const types = personType === "pj" ? DOC_TYPES_PJ : DOC_TYPES_PF;
    setUploadDocType((prev) =>
      types[prev] ? prev : (Object.keys(types)[0] ?? "cnh")
    );
  }, [personType]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !createdClient) return;
    const pages = Math.max(1, Math.min(30, uploadPageCount));
    if (totalPages + pages > 30) {
      alert(
        `Limite de 30 páginas. Total atual: ${totalPages}. Reduza o número de páginas.`
      );
      e.target.value = "";
      return;
    }
    try {
      const path = await publicClientApi.uploadClientDoc(createdClient.id, file);
      const doc = await publicClientApi.createClientDocument({
        client_id: createdClient.id,
        doc_type: uploadDocType,
        doc_name: file.name,
        file_url: path,
        page_count: pages,
      });
      setDocs([doc, ...docs]);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (personType === "pf" && !f.full_name.trim()) {
      alert("Preencha o nome completo.");
      return;
    }
    if (personType === "pj" && !f.company_name.trim()) {
      alert("Preencha a razão social.");
      return;
    }
    setSaving(true);
    try {
      const visitorId = typeof localStorage !== "undefined" ? localStorage.getItem("multi_visitor_id") ?? "" : "";
      const created = await publicClientApi.createClient({
        person_type: personType,
        ...f,
        visitor_id: visitorId || undefined,
      } as Partial<Client>);
      setCreatedClient(created);
    } catch (e: unknown) {
      alert((e as Error).message);
    }
    setSaving(false);
  };

  const handleConclude = () => {
    setConcluded(true);
    setTimeout(() => navigate("/#modelos"), 3000);
  };

  if (concluded) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-20 bg-muted/50">
          <div className="container max-w-xl text-center">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
              <Check size={48} className="mx-auto text-green-600 mb-4" />
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Cadastro enviado com sucesso!
              </h1>
              <p className="text-green-700">
                Nossa equipe entrará em contato em breve para dar continuidade ao
                processo de aprovação.
              </p>
              <p className="text-sm text-green-600 mt-4">
                Redirecionando para a página inicial...
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (createdClient) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-20 bg-muted/50">
          <div className="container max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCreatedClient(null)}
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Envie seus documentos
              </h1>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6 text-green-800 text-sm">
              <span>
                ✓ Cadastro realizado. Envie os documentos abaixo para análise de
                aprovação.
              </span>
            </div>
            <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Tipo
                  </label>
                  <select
                    className="px-3 py-2 border rounded-lg text-sm"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                  >
                    {Object.entries(docTypes).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Páginas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="w-20 px-3 py-2 border rounded-lg text-sm"
                    value={uploadPageCount}
                    onChange={(e) =>
                      setUploadPageCount(
                        Math.max(1, Math.min(30, Number(e.target.value) || 1))
                      )
                    }
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {totalPages}/30 páginas
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf,.jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleDocUpload}
                  />
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground text-sm rounded-lg hover:opacity-90 font-medium">
                    <Upload size={14} /> Enviar Documento
                  </span>
                </label>
              </div>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum documento enviado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border rounded-lg text-sm"
                    >
                      <FileText size={18} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.doc_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {docTypes[doc.doc_type] ?? doc.doc_type} •{" "}
                          {doc.page_count ?? 1} pág.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="cta"
                size="lg"
                onClick={handleConclude}
                className="flex-1"
              >
                <Check size={18} className="mr-2" />
                Concluir e enviar para análise
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao site
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-20 bg-muted/50">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Cadastro para aprovação
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha seus dados e envie os documentos para análise
              </p>
            </div>
          </div>

          {state?.car && (
            <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 text-sm">
              <strong>Veículo de interesse:</strong>{" "}
              {state.variant
                ? `${state.variant.marca} ${state.variant.modelo_carro}`
                : state.car}
              {state.variant && (
                <span className="block mt-1 text-muted-foreground">
                  {state.variant.formattedPrice}/mês • {state.variant.prazo_contrato} meses • {state.variant.franquia_km_mes} KM
                </span>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Pessoa
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={personType === "pf"}
                    onChange={() => setPersonType("pf")}
                  />
                  <User size={16} /> Pessoa Física
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={personType === "pj"}
                    onChange={() => setPersonType("pj")}
                  />
                  <Building2 size={16} /> Pessoa Jurídica
                </label>
              </div>
            </div>

            {personType === "pf" && (
              <Section title="Dados Pessoais">
                <Input
                  label="Nome Completo"
                  value={f.full_name}
                  onChange={(v) => set("full_name", v)}
                  required
                />
                <Input
                  label="CPF"
                  value={f.cpf}
                  onChange={(v) => set("cpf", v)}
                  placeholder="000.000.000-00"
                />
                <Input label="RG" value={f.rg} onChange={(v) => set("rg", v)} />
                <Input
                  label="Data de Nascimento"
                  value={f.birth_date}
                  onChange={(v) => set("birth_date", v)}
                  type="date"
                />
                <Input
                  label="Estado Civil"
                  value={f.marital_status}
                  onChange={(v) => set("marital_status", v)}
                />
                <Input
                  label="Profissão"
                  value={f.occupation}
                  onChange={(v) => set("occupation", v)}
                />
                <Input
                  label="Renda Mensal (R$)"
                  value={f.monthly_income}
                  onChange={(v) => set("monthly_income", v)}
                  type="number"
                />
              </Section>
            )}

            {personType === "pj" && (
              <Section title="Dados Empresariais">
                <Input
                  label="Razão Social"
                  value={f.company_name}
                  onChange={(v) => set("company_name", v)}
                  required
                />
                <Input
                  label="Nome Fantasia"
                  value={f.trade_name}
                  onChange={(v) => set("trade_name", v)}
                />
                <Input
                  label="CNPJ"
                  value={f.cnpj}
                  onChange={(v) => set("cnpj", v)}
                  placeholder="00.000.000/0000-00"
                />
                <Input
                  label="Inscrição Estadual"
                  value={f.state_registration}
                  onChange={(v) => set("state_registration", v)}
                />
                <Input
                  label="Nome do Signatário"
                  value={f.responsible_name}
                  onChange={(v) => set("responsible_name", v)}
                />
                <Input
                  label="CPF do Signatário"
                  value={f.responsible_cpf}
                  onChange={(v) => set("responsible_cpf", v)}
                />
                <Input
                  label="Data Nasc. Signatário"
                  value={f.responsible_birth_date}
                  onChange={(v) => set("responsible_birth_date", v)}
                  type="date"
                />
                <Input
                  label="Profissão"
                  value={f.responsible_occupation}
                  onChange={(v) => set("responsible_occupation", v)}
                />
                <Input
                  label="Cor Desejada"
                  value={f.desired_color}
                  onChange={(v) => set("desired_color", v)}
                />
                <Input
                  label="Cidade Entrega"
                  value={f.delivery_city}
                  onChange={(v) => set("delivery_city", v)}
                />
                <Input
                  label="Estado Entrega"
                  value={f.delivery_state}
                  onChange={(v) => set("delivery_state", v)}
                />
              </Section>
            )}

            <Section title="Contato">
              <Input
                label="Email"
                value={f.email}
                onChange={(v) => set("email", v)}
                type="email"
              />
              <Input
                label="Telefone"
                value={f.phone}
                onChange={(v) => set("phone", v)}
              />
              <Input
                label="Telefone 2"
                value={f.phone2}
                onChange={(v) => set("phone2", v)}
              />
            </Section>

            <Section title="Endereço">
              <Input
                label="CEP"
                value={f.zip_code}
                onChange={(v) => set("zip_code", v)}
              />
              <Input
                label="Rua"
                value={f.street}
                onChange={(v) => set("street", v)}
                className="md:col-span-2"
              />
              <Input
                label="Número"
                value={f.street_number}
                onChange={(v) => set("street_number", v)}
              />
              <Input
                label="Complemento"
                value={f.complement}
                onChange={(v) => set("complement", v)}
              />
              <Input
                label="Bairro"
                value={f.neighborhood}
                onChange={(v) => set("neighborhood", v)}
              />
              <Input
                label="Cidade"
                value={f.city}
                onChange={(v) => set("city", v)}
              />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={f.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {STATES_BR.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </Section>

            <div className="flex gap-2 pt-4">
              <Button
                variant="cta"
                size="lg"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Enviando..." : "Continuar para documentos"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
