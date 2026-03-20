import { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  parseExcelFileRaw,
  parseWithMapping,
  buildMappingsFromSheets,
  DB_COLUMN_LABELS,
  CATEGORIAS,
  type SheetData,
  type SheetColumnMapping,
  type DbColumnKey,
  type ParsedCarPriceRow,
} from "@/lib/carPriceImport";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Table2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCarSource } from "@/hooks/useCarSource";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DB_COLUMNS = Object.keys(DB_COLUMN_LABELS) as DbColumnKey[];

const ImportCarPricesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { carSource, setCarSource } = useCarSource();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [mapping, setMapping] = useState<SheetColumnMapping>({});
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [unknownMarcasOpen, setUnknownMarcasOpen] = useState(false);
  const [marcaInputs, setMarcaInputs] = useState<Record<string, string>>({});
  const [savingMarcas, setSavingMarcas] = useState(false);
  const [unknownCategoriasOpen, setUnknownCategoriasOpen] = useState(false);
  const [categoriaInputs, setCategoriaInputs] = useState<Record<string, string>>({});
  const [savingCategorias, setSavingCategorias] = useState(false);

  const { data: learnedBrands = new Map<string, string>() } = useQuery({
    queryKey: ["car-brand-mappings"],
    queryFn: () => api.getCarBrandMappings(),
    staleTime: 60 * 1000,
  });

  const { data: learnedCategories = new Map<string, string>() } = useQuery({
    queryKey: ["car-category-mappings"],
    queryFn: () => api.getCarCategoryMappings(),
    staleTime: 60 * 1000,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext ?? "")) {
      toast({
        title: "Formato inválido",
        description: "Envie um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setLoading(true);
    setSheets([]);
    setMapping({});
    setSelectedSheets(new Set());
    setExpandedSheet(null);
    setPreviewSheet(null);
    try {
      const data = await parseExcelFileRaw(f);
      setSheets(data);
      setMapping(buildMappingsFromSheets(data));
      setSelectedSheets(new Set(data.map((s) => s.sheetName)));
      if (data.length > 0) setExpandedSheet(data[0].sheetName);
      toast({
        title: "Planilha lida",
        description: `${data.length} aba(s) encontrada(s). Vincule as colunas e selecione as abas a importar.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao ler planilha",
        description: err instanceof Error ? err.message : "Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleSheet = (name: string) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const setColumnMapping = (sheetName: string, dbCol: DbColumnKey, excelColIdx: number | null) => {
    setMapping((prev) => {
      const sheetMap = { ...(prev[sheetName] ?? {}) };
      for (const k of DB_COLUMNS) {
        if (sheetMap[k] === excelColIdx && k !== dbCol) sheetMap[k] = null;
      }
      sheetMap[dbCol] = excelColIdx;
      return { ...prev, [sheetName]: sheetMap };
    });
  };

  const parsedRowsBase = useMemo(
    () => (sheets.length > 0 ? parseWithMapping(sheets, mapping, selectedSheets, learnedBrands, learnedCategories) : []),
    [sheets, mapping, selectedSheets, learnedBrands, learnedCategories]
  );

  const unknownCars = useMemo(() => {
    const names = new Set(parsedRowsBase.filter((r) => r.nome_carro && !r.marca).map((r) => r.nome_carro));
    return [...names].sort();
  }, [parsedRowsBase]);

  const unknownCategorias = useMemo(() => {
    const names = new Set(parsedRowsBase.filter((r) => r.nome_carro && !r.categoria).map((r) => r.nome_carro));
    return [...names].sort();
  }, [parsedRowsBase]);

  const parsedRows = useMemo(() => {
    let rows = parsedRowsBase;
    if (Object.keys(marcaInputs).length > 0) {
      rows = rows.map((r) => ({
        ...r,
        marca: r.marca || marcaInputs[r.nome_carro]?.trim() || "",
      }));
    }
    if (Object.keys(categoriaInputs).length > 0) {
      rows = rows.map((r) => ({
        ...r,
        categoria: r.categoria || categoriaInputs[r.nome_carro]?.trim() || "",
      }));
    }
    return rows;
  }, [parsedRowsBase, marcaInputs, categoriaInputs]);

  const previewRows = useMemo(() => {
    if (!previewSheet) return parsedRows;
    return parsedRows.filter((r) => r.source_sheet === previewSheet);
  }, [parsedRows, previewSheet]);


  const openUnknownCategoriasDialog = () => {
    const initial: Record<string, string> = {};
    for (const n of unknownCategorias) initial[n] = categoriaInputs[n] ?? "";
    setCategoriaInputs(initial);
    setUnknownCategoriasOpen(true);
  };

  const handleSaveCategorias = async () => {
    const toSave = unknownCategorias.filter((n) => categoriaInputs[n]?.trim());
    if (toSave.length === 0) {
      setUnknownCategoriasOpen(false);
      return;
    }
    setSavingCategorias(true);
    try {
      for (const nome of toSave) {
        await api.saveCarCategoryMapping(nome, categoriaInputs[nome].trim());
      }
      await queryClient.invalidateQueries({ queryKey: ["car-category-mappings"] });
      toast({
        title: "Categorias salvas",
        description: `${toSave.length} categoria(s) aprendida(s) para as próximas importações.`,
      });
      setUnknownCategoriasOpen(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSavingCategorias(false);
    }
  };

  const openUnknownMarcasDialog = () => {
    const initial: Record<string, string> = {};
    for (const n of unknownCars) initial[n] = marcaInputs[n] ?? "";
    setMarcaInputs(initial);
    setUnknownMarcasOpen(true);
  };

  const handleSaveMarcas = async () => {
    const toSave = unknownCars.filter((n) => marcaInputs[n]?.trim());
    if (toSave.length === 0) {
      setUnknownMarcasOpen(false);
      return;
    }
    setSavingMarcas(true);
    try {
      for (const nome of toSave) {
        await api.saveCarBrandMapping(nome, marcaInputs[nome].trim());
      }
      await queryClient.invalidateQueries({ queryKey: ["car-brand-mappings"] });
      toast({
        title: "Marcas salvas",
        description: `${toSave.length} marca(s) aprendida(s) para as próximas importações.`,
      });
      setUnknownMarcasOpen(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSavingMarcas(false);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Selecione abas e vincule pelo menos Nome do Carro ou Valor Mensal.",
        variant: "destructive",
      });
      return;
    }
    if (unknownCategorias.length > 0 && !unknownCategorias.every((n) => categoriaInputs[n]?.trim())) {
      toast({
        title: "Categorias pendentes",
        description: "Informe a categoria de todos os carros não identificados antes de importar.",
        variant: "destructive",
      });
      return;
    }
    setImporting(true);
    try {
      for (const nome of unknownCars) {
        if (marcaInputs[nome]?.trim()) {
          await api.saveCarBrandMapping(nome, marcaInputs[nome].trim());
        }
      }
      for (const nome of unknownCategorias) {
        if (categoriaInputs[nome]?.trim()) {
          await api.saveCarCategoryMapping(nome, categoriaInputs[nome].trim());
        }
      }
      if (unknownCars.some((n) => marcaInputs[n]?.trim())) {
        await queryClient.invalidateQueries({ queryKey: ["car-brand-mappings"] });
      }
      if (unknownCategorias.some((n) => categoriaInputs[n]?.trim())) {
        await queryClient.invalidateQueries({ queryKey: ["car-category-mappings"] });
      }
      const uniqueCars = new Map<string, { marca: string; nome_carro: string }>();
      for (const r of parsedRows) {
        const marca = (r.marca ?? "").trim();
        const nome = (r.nome_carro ?? "").trim();
        if (!nome) continue;
        const key = `${marca.toLowerCase()}|${nome.toLowerCase()}`;
        if (!uniqueCars.has(key)) uniqueCars.set(key, { marca, nome_carro: nome });
      }
      for (const { marca, nome_carro } of uniqueCars.values()) {
        await api.deleteCarPricesByCar(marca, nome_carro);
      }
      const count = await api.insertCarPrices(
        parsedRows.map((r) => ({
          marca: r.marca,
          nome_carro: r.nome_carro,
          modelo_carro: r.modelo_carro,
          categoria: r.categoria,
          prazo_contrato: r.prazo_contrato,
          franquia_km_mes: r.franquia_km_mes,
          tipo_pintura: r.tipo_pintura,
          troca_pneus: r.troca_pneus,
          manutencao: r.manutencao,
          seguro: r.seguro,
          carro_reserva: r.carro_reserva,
          insulfilm: r.insulfilm,
          valor_km_excedido: r.valor_km_excedido,
          valor_mensal_locacao: r.valor_mensal_locacao,
          source_sheet: r.source_sheet,
          source_row: r.source_row,
        }))
      );
      await queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
      if (carSource !== "importar") {
        await setCarSource("importar");
      }
      toast({
        title: "Importação concluída",
        description: `${count} registro(s) inserido(s). Os carros aparecem em Modelos Disponíveis no site.`,
      });
      setSheets([]);
      setFile(null);
    } catch (err) {
      toast({
        title: "Erro na importação",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.deleteAllCarPrices();
      toast({ title: "Excluído", description: "Todos os preços importados foram removidos." });
      setDeleteAllOpen(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Importar planilha de preços</h2>
          <p className="text-sm text-slate-500 mt-1">
            Envie um Excel e vincule cada coluna da planilha à coluna correta do banco. O mapeamento é por aba.
            Selecione quais abas importar. Os carros aparecem em <strong>Modelos Disponíveis</strong> no site.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <Label htmlFor="import-reflect" className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Refletir no site
          </Label>
          <Switch
            id="import-reflect"
            checked={carSource === "importar"}
            onCheckedChange={(checked) => {
              setCarSource(checked ? "importar" : "");
            }}
          />
          {carSource === "importar" && (
            <span className="text-xs text-green-600 font-medium">Ativo</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={loading}>
          {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Upload size={18} className="mr-2" />}
          {loading ? "Lendo planilha..." : "Selecionar arquivo Excel"}
        </Button>
        {file && (
          <span className="ml-3 text-sm text-slate-600 flex items-center gap-2">
            <FileSpreadsheet size={16} />
            {file.name}
          </span>
        )}
      </div>

      {sheets.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Table2 size={18} />
              Vincular colunas por aba
            </h3>
            <div className="flex flex-wrap gap-2">
              {unknownCars.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openUnknownMarcasDialog}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <HelpCircle size={16} className="mr-1" />
                  Informar {unknownCars.length} marca(s) não identificada(s)
                </Button>
              )}
              {unknownCategorias.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openUnknownCategoriasDialog}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <HelpCircle size={16} className="mr-1" />
                  Informar {unknownCategorias.length} categoria(s) não identificada(s)
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSheets([]);
                  setFile(null);
                  setMarcaInputs({});
                  setCategoriaInputs({});
                  setPreviewSheet(null);
                }}
              >
                Novo arquivo
              </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={
                    importing ||
                    parsedRows.length === 0 ||
                    (unknownCategorias.length > 0 && !unknownCategorias.every((n) => categoriaInputs[n]?.trim()))
                  }
                >
                {importing ? <Loader2 size={16} className="animate-spin mr-1" /> : <ArrowRight size={16} className="mr-1" />}
                Importar ({parsedRows.length} linhas)
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {sheets.map((sheet) => {
              const isExpanded = expandedSheet === sheet.sheetName;
              const isSelected = selectedSheets.has(sheet.sheetName);
              const sheetMapping = mapping[sheet.sheetName] ?? {};

              return (
                <div key={sheet.sheetName} className="border-b border-slate-100 last:border-0">
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      const next = isExpanded ? null : sheet.sheetName;
                      setExpandedSheet(next);
                      setPreviewSheet(next);
                    }}
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSheet(sheet.sheetName)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-medium">{sheet.sheetName}</span>
                    <span className="text-slate-500 text-sm">({sheet.rows.length} linhas)</span>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 bg-slate-50/50">
                      <p className="text-xs text-slate-500 mb-3">
                        Para cada coluna do banco, selecione a coluna correspondente na planilha. Ex: &quot;Commander Black Hurricane 2.0 4x4 TB Aut&quot; → Nome = Commander, Modelo = Black Hurricane 2.0 4x4 TB Aut.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {DB_COLUMNS.map((dbCol) => (
                          <div key={dbCol} className="flex items-center gap-2">
                            <Label className="text-sm w-44 shrink-0">{DB_COLUMN_LABELS[dbCol]}</Label>
                            <select
                              className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                              value={sheetMapping[dbCol] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setColumnMapping(sheet.sheetName, dbCol, v === "" ? null : parseInt(v, 10));
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">— Não vincular</option>
                              {sheet.headers.map((h, i) => (
                                <option key={i} value={i}>
                                  {h || `Coluna ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {parsedRows.length > 0 && (
            <div className="border-t">
              <div className="px-4 py-2 bg-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  Pré-visualização
                  {previewSheet ? (
                    <> — Aba &quot;{previewSheet}&quot; ({previewRows.length} linhas)</>
                  ) : (
                    <> — Todas as abas ({parsedRows.length} linhas)</>
                  )}
                </span>
                {previewSheet ? (
                  <Button variant="ghost" size="sm" onClick={() => setPreviewSheet(null)}>
                    Ver todas as abas
                  </Button>
                ) : (
                  <div className="flex gap-1 flex-wrap">
                    {sheets.filter((s) => selectedSheets.has(s.sheetName)).map((s) => (
                      <Button
                        key={s.sheetName}
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewSheet(s.sheetName)}
                      >
                        {s.sheetName}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
                <table className="w-full text-sm min-w-max">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Marca</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Nome do Carro</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Modelo</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Categoria</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Prazo Contrato</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Franquia km/mês</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Tipo Pintura</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Troca Pneus</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Manutenção</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Seguro</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Carro Reserva</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Insulfilm</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Valor km Excedido</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Valor Mensal</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Aba</th>
                      <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Linha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap">{r.marca || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{r.nome_carro || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.modelo_carro || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.categoria || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.prazo_contrato || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.franquia_km_mes || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.tipo_pintura || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.troca_pneus || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.manutencao || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.seguro || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.carro_reserva || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.insulfilm || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.valor_km_excedido || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.valor_mensal_locacao || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.source_sheet}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.source_row}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 50 && (
                <p className="text-xs text-slate-500 px-4 py-2 border-t">
                  Exibindo 50 de {previewRows.length} linhas.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => setDeleteAllOpen(true)}
        >
          <Trash2 size={16} className="mr-1" />
          Excluir todos os preços importados
        </Button>
      </div>

      <Dialog open={unknownCategoriasOpen} onOpenChange={setUnknownCategoriasOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categorias não identificadas</DialogTitle>
            <DialogDescription>
              Selecione a categoria de cada carro para que o sistema aprenda e reconheça nas próximas importações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {unknownCategorias.map((nome) => (
              <div key={nome} className="flex items-center gap-3">
                <Label className="w-32 shrink-0 truncate" title={nome}>
                  {nome}
                </Label>
                <select
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={categoriaInputs[nome] ?? ""}
                  onChange={(e) => setCategoriaInputs((p) => ({ ...p, [nome]: e.target.value }))}
                >
                  <option value="">— Selecione —</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnknownCategoriasOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategorias} disabled={savingCategorias}>
              {savingCategorias ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              Salvar e continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unknownMarcasOpen} onOpenChange={setUnknownMarcasOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcas não identificadas</DialogTitle>
            <DialogDescription>
              Informe a marca de cada carro para que o sistema aprenda e reconheça nas próximas importações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {unknownCars.map((nome) => (
              <div key={nome} className="flex items-center gap-3">
                <Label className="w-32 shrink-0 truncate" title={nome}>
                  {nome}
                </Label>
                <Input
                  placeholder="Ex: Jeep"
                  value={marcaInputs[nome] ?? ""}
                  onChange={(e) => setMarcaInputs((p) => ({ ...p, [nome]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnknownMarcasOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMarcas} disabled={savingMarcas}>
              {savingMarcas ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              Salvar e continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os preços?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá todos os registros da tabela car_prices. Os carros deixarão de aparecer no site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportCarPricesTab;
