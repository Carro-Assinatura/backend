import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type BotConfig } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle,
  Bot,
  ExternalLink,
  Info,
} from "lucide-react";

const EMPTY: Partial<BotConfig> = {
  active: false,
  webhook_url: "",
  initial_messages: [],
  show_welcome_screen: false,
  i18n_title: "Olá! 👋",
  i18n_subtitle: "Inicie uma conversa. Estamos aqui para ajudar.",
  i18n_input_placeholder: "Digite sua mensagem...",
  i18n_get_started: "Nova conversa",
  mode: "window",
  enable_streaming: false,
  theme_primary_color: "#25D366",
  load_previous_session: true,
};

const BotConfigPage = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [form, setForm] = useState<Partial<BotConfig>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getBotConfig()
      .then((c) => {
        setConfig(c);
        if (c) {
          setForm({
            active: c.active,
            webhook_url: c.webhook_url,
            initial_messages: c.initial_messages ?? [],
            show_welcome_screen: c.show_welcome_screen,
            i18n_title: c.i18n_title,
            i18n_subtitle: c.i18n_subtitle,
            i18n_input_placeholder: c.i18n_input_placeholder,
            i18n_get_started: c.i18n_get_started,
            mode: c.mode,
            enable_streaming: c.enable_streaming,
            theme_primary_color: c.theme_primary_color,
            load_previous_session: c.load_previous_session,
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateBotConfig(form);
      setConfig(updated);
      queryClient.invalidateQueries({ queryKey: ["bot-config"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const initialMessagesStr = Array.isArray(form.initial_messages)
    ? form.initial_messages.join("\n")
    : "";

  const setInitialMessages = (s: string) => {
    setForm((f) => ({
      ...f,
      initial_messages: s.split("\n").filter((m) => m.trim()),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot size={28} />
            Configuração do Bot N8N
          </h1>
          <p className="text-slate-500 mt-1">
            Integre o chatbot N8N ao site. No desktop: bot aparece; no mobile: WhatsApp.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          Salvar
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Configuração salva com sucesso!
        </div>
      )}

      {/* Status e Webhook */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Conexão N8N</h2>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Bot ativo</Label>
            <p className="text-xs text-slate-500">
              Quando ativo, o bot aparece no desktop. No mobile continua o WhatsApp.
            </p>
          </div>
          <Switch
            checked={form.active ?? false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
          />
        </div>

        <div>
          <Label htmlFor="webhook-url">URL do Webhook N8N *</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://seu-n8n.app.n8n.cloud/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={form.webhook_url ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
            className="mt-1.5 font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info size={12} />
            No workflow N8N, use o nó <strong>Chat Trigger</strong>. Adicione seu domínio em &quot;Allowed Origins (CORS)&quot;.
          </p>
          <a
            href="https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.chattrigger/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
          >
            <ExternalLink size={12} /> Documentação N8N Chat Trigger
          </a>
        </div>
      </div>

      {/* Mensagens e i18n */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Mensagens e Textos</h2>

        <div>
          <Label htmlFor="initial-messages">Mensagens iniciais (uma por linha)</Label>
          <textarea
            id="initial-messages"
            placeholder="Olá! 👋&#10;Como posso ajudar você hoje?"
            value={initialMessagesStr}
            onChange={(e) => setInitialMessages(e.target.value)}
            className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Tela de boas-vindas</Label>
            <p className="text-xs text-slate-500">Exibir tela de boas-vindas ao abrir o chat</p>
          </div>
          <Switch
            checked={form.show_welcome_screen ?? false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, show_welcome_screen: v }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="i18n-title">Título</Label>
            <Input
              id="i18n-title"
              value={form.i18n_title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, i18n_title: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="i18n-subtitle">Subtítulo</Label>
            <Input
              id="i18n-subtitle"
              value={form.i18n_subtitle ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, i18n_subtitle: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="i18n-placeholder">Placeholder do campo de texto</Label>
            <Input
              id="i18n-placeholder"
              value={form.i18n_input_placeholder ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, i18n_input_placeholder: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="i18n-getstarted">Texto do botão Nova conversa</Label>
            <Input
              id="i18n-getstarted"
              value={form.i18n_get_started ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, i18n_get_started: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Opções avançadas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Opções avançadas</h2>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Streaming de respostas</Label>
            <p className="text-xs text-slate-500">
              Exibir respostas em tempo real (requer configuração no workflow N8N)
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Se aparecer &quot;No response received&quot;, desative aqui ou ative streaming no nó AI Agent do N8N.
            </p>
          </div>
          <Switch
            checked={form.enable_streaming ?? false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, enable_streaming: v }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Carregar sessão anterior</Label>
            <p className="text-xs text-slate-500">Manter histórico da conversa ao reabrir</p>
          </div>
          <Switch
            checked={form.load_previous_session ?? true}
            onCheckedChange={(v) => setForm((f) => ({ ...f, load_previous_session: v }))}
          />
        </div>

        <div>
          <Label htmlFor="mode">Modo de exibição</Label>
          <select
            id="mode"
            value={form.mode ?? "window"}
            onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as "window" | "fullscreen" }))}
            className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="window">Janela (popup flutuante)</option>
            <option value="fullscreen">Tela cheia</option>
          </select>
        </div>

        <div>
          <Label htmlFor="theme-color">Cor primária do bot</Label>
          <div className="flex gap-2 mt-1.5">
            <input
              id="theme-color"
              type="color"
              value={form.theme_primary_color ?? "#25D366"}
              onChange={(e) => setForm((f) => ({ ...f, theme_primary_color: e.target.value }))}
              className="w-12 h-10 rounded border cursor-pointer"
            />
            <Input
              value={form.theme_primary_color ?? "#25D366"}
              onChange={(e) => setForm((f) => ({ ...f, theme_primary_color: e.target.value }))}
              className="font-mono w-28"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
        Salvar configuração
      </Button>
    </div>
  );
};

export default BotConfigPage;
