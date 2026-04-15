import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DUPLICATE_FIELD_OPTIONS, FILTER_FIELD_OPTIONS } from "@/lib/carPriceImport";

const ImportSettingsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [duplicatePreference, setDuplicatePreference] = useState<"maior" | "menor">("maior");
  const [filterFields, setFilterFields] = useState<string[]>([]);
  const [duplicateFields, setDuplicateFields] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["import-settings"],
    queryFn: () => api.getImportSettings(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (settings) {
      setDuplicatePreference(settings.duplicate_preference);
      setFilterFields(settings.filter_fields);
      setDuplicateFields(settings.duplicate_fields);
    }
  }, [settings]);

  const toggleFilterField = (key: string) => {
    setFilterFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort()
    );
  };

  const toggleDuplicateField = (key: string) => {
    setDuplicateFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.saveImportSettings({
        duplicate_preference: duplicatePreference,
        filter_fields: filterFields,
        duplicate_fields: duplicateFields,
      });
      await queryClient.invalidateQueries({ queryKey: ["import-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Salvo", description: "Configurações de importação atualizadas." });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Configurações de importação de planilhas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Defina como o sistema trata duplicidades e quais campos aparecem no filtro.
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
          <CheckCircle size={16} /> Configurações salvas com sucesso!
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <Label className="text-base font-medium text-slate-800">
            Preferência de preço em duplicados
          </Label>
          <p className="text-sm text-slate-500 mt-1 mb-3">
            Quando houver registros com mesmo modelo, franquia e prazo, qual valor manter?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="duplicate_preference"
                checked={duplicatePreference === "maior"}
                onChange={() => setDuplicatePreference("maior")}
                className="rounded-full"
              />
              <span>Manter preço mais alto</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="duplicate_preference"
                checked={duplicatePreference === "menor"}
                onChange={() => setDuplicatePreference("menor")}
                className="rounded-full"
              />
              <span>Manter preço mais baixo</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium text-slate-800">
            Campos do filtro de carros
          </Label>
          <p className="text-sm text-slate-500 mt-1 mb-3">
            Selecione quais campos aparecem no filtro da aba Importar.
          </p>
          <div className="flex flex-wrap gap-4">
            {FILTER_FIELD_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filterFields.includes(key)}
                  onCheckedChange={() => toggleFilterField(key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-medium text-slate-800">
            Campos para comparativo de igualdade (duplicidade)
          </Label>
          <p className="text-sm text-slate-500 mt-1 mb-3">
            Selecione quais campos definem quando dois registros são considerados duplicados.
          </p>
          <div className="flex flex-wrap gap-4">
            {DUPLICATE_FIELD_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={duplicateFields.includes(key)}
                  onCheckedChange={() => toggleDuplicateField(key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportSettingsTab;
