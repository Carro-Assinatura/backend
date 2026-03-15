import { useState, useEffect, useCallback } from "react";
import { api, buildUtmUrl, type UtmLink } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Link2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const EMPTY_FORM = {
  base_url: "",
  name: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
};

const UtmGeneratorTab = () => {
  const [links, setLinks] = useState<UtmLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [saveDialog, setSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UtmLink | null>(null);

  const fullUrl = buildUtmUrl(form.base_url, {
    utm_source: form.utm_source,
    utm_medium: form.utm_medium,
    utm_campaign: form.utm_campaign,
    utm_content: form.utm_content || undefined,
    utm_term: form.utm_term || undefined,
  });

  const load = useCallback(async () => {
    try {
      const data = await api.getUtmLinks();
      setLinks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const copyToClipboard = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      flash("Link copiado!");
    } catch {
      setError("Não foi possível copiar");
    }
  };

  const openSaveDialog = () => {
    if (!fullUrl) return;
    setSaveDialog(true);
  };

  const handleSave = async () => {
    if (!form.base_url.trim() || !form.utm_source.trim() || !form.utm_medium.trim() || !form.utm_campaign.trim()) {
      setError("Preencha URL, source, medium e campaign");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createUtmLink({
        name: form.name || undefined,
        base_url: form.base_url,
        utm_source: form.utm_source,
        utm_medium: form.utm_medium,
        utm_campaign: form.utm_campaign,
        utm_content: form.utm_content || undefined,
        utm_term: form.utm_term || undefined,
      });
      setSaveDialog(false);
      setForm(EMPTY_FORM);
      await load();
      flash("Link salvo no histórico!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      await api.deleteUtmLink(deleteTarget.id, deleteTarget.name || deleteTarget.utm_campaign);
      setDeleteTarget(null);
      await load();
      flash("Link excluído!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
      setDeleteTarget(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copiado!");
    } catch {
      setError("Não foi possível copiar");
    }
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
      {/* Gerador */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Gerador de Links UTM</h1>
          <p className="text-slate-500 mt-1">
            Crie URLs com parâmetros UTM para rastrear campanhas no Google Analytics e outras ferramentas.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <Label htmlFor="utm-base">URL base *</Label>
            <Input
              id="utm-base"
              placeholder="https://seusite.com.br/landing"
              value={form.base_url}
              onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
              className="mt-1.5 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="utm-source">utm_source *</Label>
              <Input
                id="utm-source"
                placeholder="Ex: google, newsletter, facebook"
                value={form.utm_source}
                onChange={(e) => setForm((f) => ({ ...f, utm_source: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="utm-medium">utm_medium *</Label>
              <Input
                id="utm-medium"
                placeholder="Ex: cpc, email, social"
                value={form.utm_medium}
                onChange={(e) => setForm((f) => ({ ...f, utm_medium: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="utm-campaign">utm_campaign *</Label>
              <Input
                id="utm-campaign"
                placeholder="Ex: black_friday_2026"
                value={form.utm_campaign}
                onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="utm-content">utm_content (opcional)</Label>
              <Input
                id="utm-content"
                placeholder="Ex: banner_principal, cta_rodape"
                value={form.utm_content}
                onChange={(e) => setForm((f) => ({ ...f, utm_content: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="utm-term">utm_term (opcional)</Label>
              <Input
                id="utm-term"
                placeholder="Ex: carro por assinatura"
                value={form.utm_term}
                onChange={(e) => setForm((f) => ({ ...f, utm_term: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Preview e ações */}
          {fullUrl && (
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <Label>Link gerado</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={fullUrl}
                  className="font-mono text-sm bg-slate-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  title="Copiar"
                  onClick={copyToClipboard}
                >
                  <Copy size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Salvar no histórico"
                  onClick={openSaveDialog}
                >
                  <Plus size={18} />
                </Button>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="icon" title="Abrir em nova aba">
                    <ExternalLink size={18} />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Link2 size={20} />
          Histórico de links
        </h2>

        {links.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Link2 className="mx-auto mb-4 text-slate-300" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Nenhum link salvo
            </h3>
            <p className="text-slate-500">
              Gere um link e clique em &quot;Salvar&quot; para guardá-lo aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 truncate">
                      {link.name || link.utm_campaign || "Sem nome"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {link.utm_source} / {link.utm_medium}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {link.full_url}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Copiar"
                    onClick={() => copyLink(link.full_url)}
                  >
                    <Copy size={16} />
                  </Button>
                  <a href={link.full_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" title="Abrir">
                      <ExternalLink size={16} />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Excluir"
                    onClick={() => setDeleteTarget(link)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog: Salvar no histórico */}
      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar link no histórico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="save-name">Nome (opcional)</Label>
              <Input
                id="save-name"
                placeholder="Ex: Campanha Black Friday - Banner"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <p className="text-xs text-slate-500">
              O link será salvo para consulta posterior.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este link do histórico?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UtmGeneratorTab;
