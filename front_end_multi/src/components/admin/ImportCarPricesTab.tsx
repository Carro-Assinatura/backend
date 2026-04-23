import { useState, useRef, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CarPrice, type CarPricePromotionAdminSummary } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  parseExcelFileRaw,
  parseWithMapping,
  buildMappingsFromSheets,
  deduplicateCarPriceRows,
  DB_COLUMN_LABELS,
  FILTER_FIELD_OPTIONS,
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
  ChevronUp,
  ChevronRight,
  ArrowRight,
  ArrowUpDown,
  HelpCircle,
  Pencil,
  Search,
  Megaphone,
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

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

function formatIsoDateEndsOnPtBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Colunas ordenáveis da tabela «Carros importados». */
type ImportedSortCol =
  | "marca"
  | "nome_carro"
  | "modelo_carro"
  | "franquia_km_mes"
  | "prazo_contrato"
  | "valor_mensal_locacao";

function compareParsedCarPriceRows(
  a: ParsedCarPriceRow,
  b: ParsedCarPriceRow,
  col: keyof ParsedCarPriceRow,
  asc: boolean,
): number {
  const dir = asc ? 1 : -1;
  const va = a[col];
  const vb = b[col];
  if (col === "source_row") {
    const na = Number(va) || 0;
    const nb = Number(vb) || 0;
    return na === nb ? 0 : na < nb ? -dir : dir;
  }
  if (
    col === "franquia_km_mes" ||
    col === "prazo_contrato" ||
    col === "valor_mensal_locacao" ||
    col === "valor_km_excedido"
  ) {
    const parseNum = (x: unknown) => {
      if (typeof x === "number" && Number.isFinite(x)) return x;
      const s = String(x ?? "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : NaN;
    };
    const na = parseNum(va);
    const nb = parseNum(vb);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na < nb ? -dir : dir;
    if (!Number.isNaN(na) && Number.isNaN(nb)) return -dir;
    if (Number.isNaN(na) && !Number.isNaN(nb)) return dir;
  }
  const sa = String(va ?? "").toLocaleLowerCase("pt-BR");
  const sb = String(vb ?? "").toLocaleLowerCase("pt-BR");
  if (sa < sb) return -dir;
  if (sa > sb) return dir;
  return 0;
}

function SortableTableHeader({
  children,
  active,
  ascending,
  onClick,
  nowrap,
}: {
  children: ReactNode;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
  nowrap?: boolean;
}) {
  return (
    <th className={`text-left px-3 py-2 font-medium ${nowrap ? "whitespace-nowrap" : ""}`}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 -mx-1 hover:bg-slate-200/80 w-full text-left${active ? " font-semibold text-slate-900" : ""}`}
        onClick={onClick}
      >
        <span className="min-w-0 truncate">{children}</span>
        {active ? (
          ascending ? (
            <ChevronUp className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        )}
      </button>
    </th>
  );
}

const PREVIEW_SORTABLE_COLUMNS: { key: keyof ParsedCarPriceRow; label: string }[] = [
  { key: "marca", label: "Marca" },
  { key: "nome_carro", label: "Nome do Carro" },
  { key: "modelo_carro", label: "Modelo" },
  { key: "categoria", label: "Categoria" },
  { key: "prazo_contrato", label: "Prazo Contrato" },
  { key: "franquia_km_mes", label: "Franquia km/mês" },
  { key: "tipo_pintura", label: "Tipo Pintura" },
  { key: "troca_pneus", label: "Troca Pneus" },
  { key: "manutencao", label: "Manutenção" },
  { key: "seguro", label: "Seguro" },
  { key: "carro_reserva", label: "Carro Reserva" },
  { key: "insulfilm", label: "Insulfilm" },
  { key: "valor_km_excedido", label: "Valor km Excedido" },
  { key: "valor_mensal_locacao", label: "Valor Mensal" },
  { key: "source_sheet", label: "Aba" },
  { key: "source_row", label: "Linha" },
];

function PromoIntranetSummary({ promo }: { promo: CarPricePromotionAdminSummary }) {
  return (
    <span className="text-xs font-bold text-red-700 tabular-nums flex flex-wrap items-center gap-x-1.5 gap-y-0 self-center">
      <span className="whitespace-nowrap">
        {Number(promo.promo_valor_mensal_locacao).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })}
      </span>
      {promo.ends_on ? (
        <span className="whitespace-nowrap font-semibold text-red-600/90">
          até {formatIsoDateEndsOnPtBR(promo.ends_on)}
        </span>
      ) : null}
    </span>
  );
}

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

  /* Carros importados: filtro, paginação, edição */
  const [filterMarca, setFilterMarca] = useState("");
  const [filterNome, setFilterNome] = useState("");
  const [filterModelo, setFilterModelo] = useState("");
  const [filterFranquia, setFilterFranquia] = useState("");
  const [filterPrazo, setFilterPrazo] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [importedSort, setImportedSort] = useState<{ col: ImportedSortCol; asc: boolean } | null>(null);
  const [previewSort, setPreviewSort] = useState<{ col: keyof ParsedCarPriceRow; asc: boolean } | null>(null);
  const [editingCar, setEditingCar] = useState<CarPrice | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [promoTarget, setPromoTarget] = useState<CarPrice | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoValor, setPromoValor] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");

  const { data: importSettings } = useQuery({
    queryKey: ["import-settings"],
    queryFn: () => api.getImportSettings(),
    staleTime: 60 * 1000,
  });

  const filterParams = filterApplied
    ? {
        marca: filterMarca || undefined,
        nome_carro: filterNome || undefined,
        modelo_carro: filterModelo || undefined,
        franquia_km_mes: filterFranquia || undefined,
        prazo_contrato: filterPrazo || undefined,
      }
    : {};

  const { data: importedCarsData, refetch: refetchImported } = useQuery({
    queryKey: ["car-prices-admin", currentPage, pageSize, filterParams, importedSort],
    queryFn: () =>
      api.getCarPrices({
        limit: pageSize,
        offset: currentPage * pageSize,
        ...filterParams,
        ...(importedSort
          ? { orderBy: importedSort.col, orderAscending: importedSort.asc }
          : {}),
      }),
    staleTime: 30 * 1000,
  });

  const importedCars = importedCarsData?.rows ?? [];
  const importedTotal = importedCarsData?.total ?? 0;
  const totalPages = Math.ceil(importedTotal / pageSize);

  const importedCarIdsKey = useMemo(
    () =>
      importedCars
        .map((c) => c.id)
        .filter(Boolean)
        .sort()
        .join(","),
    [importedCars],
  );

  const { data: promoByCarId = new Map<string, CarPricePromotionAdminSummary>() } = useQuery({
    queryKey: ["car-price-promotions-admin", importedCarIdsKey],
    queryFn: () => api.getCarPricePromotionsForCarPriceIds(importedCars.map((c) => c.id)),
    enabled: importedCars.length > 0,
    staleTime: 30 * 1000,
  });

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

  const sortedPreviewRows = useMemo(() => {
    if (!previewSort) return previewRows;
    const rows = [...previewRows];
    rows.sort((a, b) => compareParsedCarPriceRows(a, b, previewSort.col, previewSort.asc));
    return rows;
  }, [previewRows, previewSort]);

  const toggleImportedSort = (col: ImportedSortCol) => {
    setImportedSort((prev) => {
      if (!prev || prev.col !== col) return { col, asc: true };
      return { col, asc: !prev.asc };
    });
    setCurrentPage(0);
  };

  const togglePreviewSort = (col: keyof ParsedCarPriceRow) => {
    setPreviewSort((prev) => {
      if (!prev || prev.col !== col) return { col, asc: true };
      return { col, asc: !prev.asc };
    });
  };


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
      const dupFields = importSettings?.duplicate_fields ?? ["nome_carro", "franquia_km_mes", "prazo_contrato"];
      const keepHighest = (importSettings?.duplicate_preference ?? "maior") === "maior";
      const deduplicated = deduplicateCarPriceRows(parsedRows, dupFields, keepHighest);
      const { inserted, updated } = await api.upsertCarPrices(
        deduplicated.map((r) => ({
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
        })),
        dupFields
      );
      const count = inserted + updated;
      await queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
      await queryClient.invalidateQueries({ queryKey: ["car-prices-full"] });
      await queryClient.invalidateQueries({ queryKey: ["hero-promo-snippets"] });
      await queryClient.invalidateQueries({ queryKey: ["car-price-promotions-admin"] });
      if (carSource !== "importar") {
        await setCarSource("importar");
      }
      toast({
        title: "Importação concluída",
        description: `${inserted} novo(s), ${updated} atualizado(s). Os carros aparecem em Modelos Disponíveis no site.`,
      });
      refetchImported();
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
      refetchImported();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  const filterFields = importSettings?.filter_fields ?? ["marca", "nome_carro", "modelo_carro", "franquia_km_mes", "prazo_contrato"];

  const handleSaveEdit = async () => {
    if (!editingCar) return;
    setSavingEdit(true);
    try {
      await api.updateCarPrice(editingCar.id, {
        marca: editingCar.marca,
        nome_carro: editingCar.nome_carro,
        modelo_carro: editingCar.modelo_carro,
        categoria: editingCar.categoria,
        prazo_contrato: editingCar.prazo_contrato,
        franquia_km_mes: editingCar.franquia_km_mes,
        tipo_pintura: editingCar.tipo_pintura,
        troca_pneus: editingCar.troca_pneus,
        manutencao: editingCar.manutencao,
        seguro: editingCar.seguro,
        carro_reserva: editingCar.carro_reserva,
        insulfilm: editingCar.insulfilm,
        valor_km_excedido: editingCar.valor_km_excedido,
        valor_mensal_locacao: editingCar.valor_mensal_locacao,
      });
      toast({ title: "Salvo", description: "Registro atualizado com sucesso." });
      setEditingCar(null);
      refetchImported();
      queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
      queryClient.invalidateQueries({ queryKey: ["car-prices-full"] });
      queryClient.invalidateQueries({ queryKey: ["hero-promo-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["car-price-promotions-admin"] });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const openPromoDialog = async (car: CarPrice) => {
    setPromoTarget(car);
    setPromoLoading(true);
    try {
      const existing = await api.getCarPricePromotionByCarPriceId(car.id);
      if (existing) {
        setPromoValor(String(existing.promo_valor_mensal_locacao));
        setPromoStart(String(existing.starts_on).slice(0, 10));
        setPromoEnd(String(existing.ends_on).slice(0, 10));
      } else {
        setPromoValor("");
        const t = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
        setPromoStart(t);
        setPromoEnd(t);
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível carregar a promoção.",
        variant: "destructive",
      });
      setPromoTarget(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSavePromo = async () => {
    if (!promoTarget) return;
    const v = parseFloat(String(promoValor).replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) {
      toast({ title: "Valor inválido", description: "Informe um preço promocional maior que zero.", variant: "destructive" });
      return;
    }
    if (!promoStart || !promoEnd) {
      toast({ title: "Datas obrigatórias", description: "Informe início e fim da promoção.", variant: "destructive" });
      return;
    }
    if (promoEnd < promoStart) {
      toast({ title: "Período inválido", description: "A data final deve ser igual ou posterior à inicial.", variant: "destructive" });
      return;
    }
    setPromoSaving(true);
    try {
      await api.upsertCarPricePromotion({
        car_price_id: promoTarget.id,
        promo_valor_mensal_locacao: v,
        starts_on: promoStart,
        ends_on: promoEnd,
      });
      toast({ title: "Promoção salva", description: "O site passará a exibir o preço promocional no período informado." });
      setPromoTarget(null);
      queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
      queryClient.invalidateQueries({ queryKey: ["car-prices-full"] });
      queryClient.invalidateQueries({ queryKey: ["hero-promo-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["car-price-promotions-admin"] });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível salvar a promoção.",
        variant: "destructive",
      });
    } finally {
      setPromoSaving(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!promoTarget) return;
    setPromoSaving(true);
    try {
      await api.deleteCarPricePromotion(promoTarget.id);
      toast({ title: "Promoção removida" });
      setPromoTarget(null);
      queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
      queryClient.invalidateQueries({ queryKey: ["car-prices-full"] });
      queryClient.invalidateQueries({ queryKey: ["hero-promo-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["car-price-promotions-admin"] });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível remover.",
        variant: "destructive",
      });
    } finally {
      setPromoSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carros já importados */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800">Carros importados</h3>
          <p className="text-sm text-slate-500 mt-1">
            Lista de carros já importados. Use o filtro e clique em Pesquisar para refinar.
          </p>
        </div>
        <div className="p-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap items-end gap-3">
            {filterFields.includes("marca") && (
              <div>
                <Label className="text-xs text-slate-600">Marca</Label>
                <Input
                  placeholder="Filtrar marca"
                  value={filterMarca}
                  onChange={(e) => setFilterMarca(e.target.value)}
                  className="mt-1 w-36"
                />
              </div>
            )}
            {filterFields.includes("nome_carro") && (
              <div>
                <Label className="text-xs text-slate-600">Nome</Label>
                <Input
                  placeholder="Filtrar nome"
                  value={filterNome}
                  onChange={(e) => setFilterNome(e.target.value)}
                  className="mt-1 w-40"
                />
              </div>
            )}
            {filterFields.includes("modelo_carro") && (
              <div>
                <Label className="text-xs text-slate-600">Modelo</Label>
                <Input
                  placeholder="Filtrar modelo"
                  value={filterModelo}
                  onChange={(e) => setFilterModelo(e.target.value)}
                  className="mt-1 w-40"
                />
              </div>
            )}
            {filterFields.includes("franquia_km_mes") && (
              <div>
                <Label className="text-xs text-slate-600">Franquia km/mês</Label>
                <Input
                  placeholder="Ex: 1500"
                  value={filterFranquia}
                  onChange={(e) => setFilterFranquia(e.target.value)}
                  className="mt-1 w-28"
                />
              </div>
            )}
            {filterFields.includes("prazo_contrato") && (
              <div>
                <Label className="text-xs text-slate-600">Prazo contrato</Label>
                <Input
                  placeholder="Ex: 12"
                  value={filterPrazo}
                  onChange={(e) => setFilterPrazo(e.target.value)}
                  className="mt-1 w-28"
                />
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilterApplied(true);
                setCurrentPage(0);
              }}
            >
              <Search size={14} className="mr-1" />
              Pesquisar
            </Button>
            {(filterMarca || filterNome || filterModelo || filterFranquia || filterPrazo) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterMarca("");
                  setFilterNome("");
                  setFilterModelo("");
                  setFilterFranquia("");
                  setFilterPrazo("");
                  setFilterApplied(false);
                  setCurrentPage(0);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-slate-600">Linhas por página</Label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm text-slate-500">
            {importedTotal} registro(s)
            {totalPages > 1 && ` • Página ${currentPage + 1} de ${totalPages}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-slate-100">
              <tr>
                <SortableTableHeader
                  active={importedSort?.col === "marca"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("marca")}
                >
                  Marca
                </SortableTableHeader>
                <SortableTableHeader
                  active={importedSort?.col === "nome_carro"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("nome_carro")}
                >
                  Nome
                </SortableTableHeader>
                <SortableTableHeader
                  active={importedSort?.col === "modelo_carro"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("modelo_carro")}
                >
                  Modelo
                </SortableTableHeader>
                <SortableTableHeader
                  active={importedSort?.col === "franquia_km_mes"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("franquia_km_mes")}
                >
                  Franquia
                </SortableTableHeader>
                <SortableTableHeader
                  active={importedSort?.col === "prazo_contrato"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("prazo_contrato")}
                >
                  Prazo
                </SortableTableHeader>
                <SortableTableHeader
                  active={importedSort?.col === "valor_mensal_locacao"}
                  ascending={importedSort?.asc ?? true}
                  onClick={() => toggleImportedSort("valor_mensal_locacao")}
                >
                  Valor Mensal
                </SortableTableHeader>
                <th className="text-left px-3 py-2 font-medium min-w-[220px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {importedCars.map((car) => (
                <tr key={car.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">{car.marca || "—"}</td>
                  <td className="px-3 py-2 font-medium">{car.nome_carro || "—"}</td>
                  <td className="px-3 py-2">{car.modelo_carro || "—"}</td>
                  <td className="px-3 py-2">{car.franquia_km_mes ?? "—"}</td>
                  <td className="px-3 py-2">{car.prazo_contrato ?? "—"}</td>
                  <td className="px-3 py-2">{car.valor_mensal_locacao != null ? String(car.valor_mensal_locacao) : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setEditingCar({ ...car })}
                      >
                        <Pencil size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => void openPromoDialog(car)}
                      >
                        <Megaphone size={14} className="mr-1" />
                        Promoção
                      </Button>
                      {promoByCarId.has(car.id) ? (
                        <PromoIntranetSummary promo={promoByCarId.get(car.id)!} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {importedCars.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum carro importado. Importe uma planilha abaixo.
          </div>
        )}
        {totalPages > 1 && (
          <div className="p-3 border-t flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

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
                      {PREVIEW_SORTABLE_COLUMNS.map(({ key, label }) => (
                        <SortableTableHeader
                          key={key}
                          nowrap
                          active={previewSort?.col === key}
                          ascending={previewSort?.asc ?? true}
                          onClick={() => togglePreviewSort(key)}
                        >
                          {label}
                        </SortableTableHeader>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPreviewRows.slice(0, 50).map((r, i) => (
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

      {/* Dialog Editar carro */}
      <Dialog open={!!editingCar} onOpenChange={(open) => !open && setEditingCar(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar carro</DialogTitle>
            <DialogDescription>Altere os dados e clique em Salvar.</DialogDescription>
          </DialogHeader>
          {editingCar && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marca</Label>
                  <Input
                    value={editingCar.marca ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, marca: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nome do Carro</Label>
                  <Input
                    value={editingCar.nome_carro ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, nome_carro: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={editingCar.modelo_carro ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, modelo_carro: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={editingCar.categoria ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, categoria: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Franquia km/mês</Label>
                  <Input
                    value={editingCar.franquia_km_mes ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, franquia_km_mes: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Prazo contrato</Label>
                  <Input
                    value={editingCar.prazo_contrato ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, prazo_contrato: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Valor mensal</Label>
                  <Input
                    value={editingCar.valor_mensal_locacao ?? ""}
                    onChange={(e) => setEditingCar((c) => (c ? { ...c, valor_mensal_locacao: e.target.value } : null))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCar(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editingCar}>
              {savingEdit ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!promoTarget} onOpenChange={(o) => !o && setPromoTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promoção</DialogTitle>
            <DialogDescription>
              Preço especial por período para{" "}
              <strong>
                {(promoTarget?.marca ?? "").trim()} {(promoTarget?.nome_carro ?? "").trim()}
              </strong>
              . No site, o valor promocional só aparece entre as datas informadas (horário de Brasília).
            </DialogDescription>
          </DialogHeader>
          {promoLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label>Preço promocional mensal (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 1899.90"
                  value={promoValor}
                  onChange={(e) => setPromoValor(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input type="date" value={promoStart} onChange={(e) => setPromoStart(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input type="date" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={promoSaving || promoLoading || !promoTarget}
              onClick={() => void handleRemovePromo()}
            >
              Remover promoção
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="ghost" onClick={() => setPromoTarget(null)} disabled={promoSaving}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleSavePromo()} disabled={promoSaving || promoLoading || !promoTarget}>
                {promoSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                Salvar
              </Button>
            </div>
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
