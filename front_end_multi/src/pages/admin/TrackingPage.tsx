import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, TrackingSystem, TrackingType } from "@/services/api";
import { Plus, Pencil, Trash2, Power, PowerOff, Save, X, Radar, Link2 } from "lucide-react";
import UtmGeneratorTab from "@/components/admin/UtmGeneratorTab";

const TYPE_OPTIONS: { value: TrackingType; label: string }[] = [
  { value: "gtm", label: "Google Tag Manager" },
  { value: "google_analytics", label: "Google Analytics" },
  { value: "clarity", label: "Microsoft Clarity" },
  { value: "mixpanel", label: "Mixpanel" },
  { value: "hubspot", label: "HubSpot" },
  { value: "bigquery", label: "Google BigQuery" },
  { value: "metabase", label: "Metabase" },
];

const CREDENTIAL_FIELDS: Record<TrackingType, { key: string; label: string; placeholder: string; sensitive?: boolean }[]> = {
  gtm: [
    { key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" },
    { key: "environment_auth", label: "Environment Auth (opcional)", placeholder: "" },
    { key: "environment_preview", label: "Environment Preview (opcional)", placeholder: "" },
  ],
  google_analytics: [
    { key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
    { key: "api_secret", label: "API Secret (Measurement Protocol)", placeholder: "", sensitive: true },
    { key: "stream_id", label: "Stream ID (opcional)", placeholder: "" },
  ],
  clarity: [
    { key: "project_id", label: "Project ID", placeholder: "XXXXXXXXXX" },
  ],
  mixpanel: [
    { key: "project_token", label: "Project Token", placeholder: "" },
    { key: "api_key", label: "API Key (opcional)", placeholder: "", sensitive: true },
    { key: "api_secret", label: "API Secret (opcional)", placeholder: "", sensitive: true },
  ],
  hubspot: [
    { key: "portal_id", label: "Portal ID (Hub ID)", placeholder: "" },
    { key: "tracking_code", label: "Tracking Code ID", placeholder: "" },
    { key: "access_token", label: "Access Token (API)", placeholder: "", sensitive: true },
  ],
  bigquery: [
    { key: "project_id", label: "Project ID", placeholder: "" },
    { key: "dataset_id", label: "Dataset ID", placeholder: "" },
    { key: "service_account_json", label: "Service Account JSON", placeholder: '{"type":"service_account",...}', sensitive: true },
  ],
  metabase: [
    { key: "instance_url", label: "URL da Instância", placeholder: "https://metabase.exemplo.com" },
    { key: "username", label: "Usuário / Email", placeholder: "" },
    { key: "api_key", label: "API Key", placeholder: "", sensitive: true },
  ],
};

const EMPTY_FORM = { name: "", type: "gtm" as TrackingType, credentials: {} as Record<string, string> };

export default function TrackingPage() {
  const [systems, setSystems] = useState<TrackingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSystems(await api.getTrackingSystems()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.updateTrackingSystem(editing, { name: form.name, type: form.type, credentials: form.credentials });
      } else {
        await api.createTrackingSystem({ name: form.name, type: form.type, credentials: form.credentials });
      }
      setShowNew(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
    setSaving(false);
  };

  const startEdit = (s: TrackingSystem) => {
    setEditing(s.id);
    setForm({ name: s.name, type: s.type, credentials: { ...s.credentials } });
    setShowNew(true);
  };

  const handleDelete = async (s: TrackingSystem) => {
    if (!confirm(`Excluir "${s.name}"?`)) return;
    try {
      await api.deleteTrackingSystem(s.id, s.name);
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggle = async (s: TrackingSystem) => {
    try {
      await api.updateTrackingSystem(s.id, { name: s.name, active: !s.active });
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const credFields = CREDENTIAL_FIELDS[form.type] ?? [];

  const systemsContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistemas de Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie as credenciais dos sistemas de rastreamento</p>
        </div>
        {!showNew && (
          <Button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowNew(true); }}>
            <Plus size={16} className="mr-1" /> Novo Sistema
          </Button>
        )}
      </div>

      {showNew && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold text-lg">{editing ? "Editar Sistema" : "Novo Sistema"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Google Analytics Produção"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TrackingType, credentials: {} })}
                disabled={!!editing}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Credenciais — {TYPE_OPTIONS.find((o) => o.value === form.type)?.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {credFields.map((f) => (
                <div key={f.key} className={f.key === "service_account_json" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  {f.key === "service_account_json" ? (
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono h-24"
                      value={form.credentials[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, [f.key]: e.target.value } })}
                      placeholder={f.placeholder}
                    />
                  ) : (
                    <input
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      type={f.sensitive ? "password" : "text"}
                      value={form.credentials[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, [f.key]: e.target.value } })}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowNew(false); setEditing(null); }}>
              <X size={16} className="mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : systems.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Nenhum sistema cadastrado</div>
      ) : (
        <div className="grid gap-4">
          {systems.map((s) => {
            const typeLabel = TYPE_OPTIONS.find((o) => o.value === s.type)?.label ?? s.type;
            const fields = CREDENTIAL_FIELDS[s.type] ?? [];
            return (
              <div key={s.id} className={`bg-white rounded-lg border p-5 ${!s.active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{typeLabel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                      {fields.map((f) => {
                        const val = s.credentials?.[f.key];
                        if (!val) return null;
                        return (
                          <span key={f.key}>
                            <span className="font-medium text-slate-600">{f.label}:</span>{" "}
                            {f.sensitive ? "••••••" : val}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" title={s.active ? "Desativar" : "Ativar"} onClick={() => handleToggle(s)}>
                      {s.active ? <PowerOff size={16} /> : <Power size={16} />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(s)}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(s)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <Tabs defaultValue="systems" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="systems" className="gap-2">
          <Radar size={16} />
          Sistemas
        </TabsTrigger>
        <TabsTrigger value="utm" className="gap-2">
          <Link2 size={16} />
          Gerador UTM
        </TabsTrigger>
      </TabsList>

      <TabsContent value="systems">{systemsContent}</TabsContent>
      <TabsContent value="utm">
        <UtmGeneratorTab />
      </TabsContent>
    </Tabs>
  );
}
