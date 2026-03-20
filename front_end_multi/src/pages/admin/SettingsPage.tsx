import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type SettingItem, type CarImage } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, CheckCircle, AlertTriangle, Eye, EyeOff, Upload, Trash2, ImageIcon, Settings2, Users, Map } from "lucide-react";
import { LOGO_KEY } from "@/hooks/useLogo";
import { useAuth } from "@/contexts/AuthContext";
import UserCategoriesTab from "@/components/admin/UserCategoriesTab";
import SiteMapTab from "@/components/admin/SiteMapTab";

const CATEGORY_LABELS: Record<string, string> = {
  contato: "Contato / WhatsApp",
  geral: "Geral",
};

const HIDDEN_CATEGORIES = new Set(["colunas", "google_sheets", "imagens"]);

const SECRET_KEYS = new Set(["google_sheets_api_key", "removebg_api_key"]);

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  /* Logo */
  const [logo, setLogo] = useState<CarImage | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api.getCarImages().then((imgs) => {
      setLogo(imgs.find((i) => i.car_name === LOGO_KEY) ?? null);
    });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError("");
    try {
      const url = await api.uploadCarPhoto(file);
      if (logo) {
        await api.updateCarImage(logo.id, { image_url: url });
      } else {
        await api.createCarImage({ car_name: LOGO_KEY, image_url: url });
      }
      const imgs = await api.getCarImages();
      setLogo(imgs.find((i) => i.car_name === LOGO_KEY) ?? null);
      queryClient.invalidateQueries({ queryKey: ["site-logo"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    if (!logo) return;
    setError("");
    try {
      if (logo.image_url.includes("/car-images/")) {
        await api.deleteCarPhoto(logo.image_url);
      }
      await api.deleteCarImage(logo.id, LOGO_KEY);
      setLogo(null);
      queryClient.invalidateQueries({ queryKey: ["site-logo"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao remover logo");
    }
  };

  const getValue = (key: string) => (key in dirty ? dirty[key] : settings.find((s) => s.key === key)?.value ?? "");

  const handleChange = (key: string, value: string) => {
    setDirty((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleSecret = (key: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const changes = Object.entries(dirty).map(([key, value]) => ({ key, value }));
    if (changes.length === 0) {
      setSaving(false);
      return;
    }

    try {
      await api.saveSettings(changes);
      setSettings((prev) =>
        prev.map((s) => (s.key in dirty ? { ...s, value: dirty[s.key] } : s)),
      );
      setDirty({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const grouped = settings.reduce<Record<string, SettingItem[]>>((acc, s) => {
    if (HIDDEN_CATEGORIES.has(s.category)) return acc;
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const hasDirty = Object.keys(dirty).length > 0;

  const settingsContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Configurações gerais</h2>
          <p className="text-sm text-slate-500 mt-1">Variáveis do sistema, logo e contato</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasDirty}>
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          Salvar
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Configurações salvas com sucesso!
        </div>
      )}

      <div className="space-y-8">
        {/* Logo da Empresa */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Logo da Empresa</h2>
          <p className="text-sm text-slate-500 mb-4">
            A logo será exibida no cabeçalho do site e nos carros sem foto cadastrada.
          </p>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="w-48 h-28 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logo?.image_url ? (
                <img
                  src={logo.image_url}
                  alt="Logo da empresa"
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="text-slate-300" size={36} />
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <input
                ref={logoFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                onClick={() => logoFileRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Upload className="mr-2" size={16} />
                )}
                {logo ? "Trocar Logo" : "Enviar Logo"}
              </Button>
              {logo && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogoRemove}
                >
                  <Trash2 className="mr-2" size={16} />
                  Remover Logo
                </Button>
              )}
              <p className="text-xs text-slate-400">
                PNG, JPG, WebP ou SVG. Recomendado: fundo transparente.
              </p>
            </div>
          </div>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid gap-5">
              {items.map((item) => {
                const isSecret = SECRET_KEYS.has(item.key);
                const isVisible = visibleSecrets.has(item.key);

                return (
                  <div key={item.key}>
                    <Label htmlFor={item.key} className="text-sm font-medium text-slate-700">
                      {item.label}
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id={item.key}
                        type={isSecret && !isVisible ? "password" : "text"}
                        value={getValue(item.key)}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        className={item.key in dirty ? "border-blue-400 ring-1 ring-blue-200" : ""}
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleSecret(item.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Chave: <code className="bg-slate-100 px-1 rounded">{item.key}</code>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hasDirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-xl">
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
            Salvar alterações ({Object.keys(dirty).length})
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie as variáveis do sistema e níveis de acesso</p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="geral" className="gap-2">
            <Settings2 size={16} />
            Geral
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="categorias" className="gap-2">
              <Users size={16} />
              Categoria de Usuário
            </TabsTrigger>
          )}
          <TabsTrigger value="mapa" className="gap-2">
            <Map size={16} />
            Mapa do Site
          </TabsTrigger>
        </TabsList>
        <TabsContent value="geral">{settingsContent}</TabsContent>
        {isAdmin && (
          <TabsContent value="categorias">
            <UserCategoriesTab />
          </TabsContent>
        )}
        <TabsContent value="mapa">
          <SiteMapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
