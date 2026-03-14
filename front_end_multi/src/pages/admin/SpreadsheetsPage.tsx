import { useState, useEffect, useCallback } from "react";
import {
  api,
  type Spreadsheet,
  type SpreadsheetPage,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Columns3,
  Table2,
  AlertTriangle,
  CheckCircle,
  ImageIcon,
} from "lucide-react";
import CarImagesTab from "@/components/admin/CarImagesTab";

type SheetWithPages = Spreadsheet & { pages: SpreadsheetPage[] };

/* ── Default column values ───────────────────────── */
const DEFAULT_COLS = {
  col_car_name: "Modelo-Versão",
  col_price: "Valor",
  col_category: "",
  col_image: "",
};

/* ── Empty form states ───────────────────────────── */
const emptySheet = { name: "", api_key: "", sheet_id: "" };
const emptyPage = {
  tab_name: "",
  ...DEFAULT_COLS,
  active: true,
  spreadsheet_id: "",
};

const SpreadsheetsPage = () => {
  const [sheets, setSheets] = useState<SheetWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* Sheet dialog */
  const [sheetDialog, setSheetDialog] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Spreadsheet | null>(null);
  const [sheetForm, setSheetForm] = useState(emptySheet);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  /* Page dialog */
  const [pageDialog, setPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<SpreadsheetPage | null>(null);
  const [pageForm, setPageForm] = useState(emptyPage);
  const [pageSaving, setPageSaving] = useState(false);
  const [pageParentId, setPageParentId] = useState("");

  /* Delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "sheet" | "page";
    id: string;
    name: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getSpreadsheets();
      setSheets(data);
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

  /* ── Toggle expand ─────────────────────────────── */
  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Sheet CRUD ────────────────────────────────── */
  const openNewSheet = () => {
    setEditingSheet(null);
    setSheetForm(emptySheet);
    setShowApiKey(false);
    setSheetDialog(true);
  };

  const openEditSheet = (s: Spreadsheet) => {
    setEditingSheet(s);
    setSheetForm({ name: s.name, api_key: s.api_key, sheet_id: s.sheet_id });
    setShowApiKey(false);
    setSheetDialog(true);
  };

  const saveSheet = async () => {
    setSheetSaving(true);
    setError("");
    try {
      if (editingSheet) {
        await api.updateSpreadsheet(editingSheet.id, sheetForm);
      } else {
        await api.createSpreadsheet(sheetForm);
      }
      setSheetDialog(false);
      await load();
      flash(editingSheet ? "Planilha atualizada!" : "Planilha criada!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSheetSaving(false);
    }
  };

  const toggleSheetActive = async (s: Spreadsheet) => {
    try {
      await api.updateSpreadsheet(s.id, { active: !s.active, name: s.name });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao alterar status");
    }
  };

  /* ── Page CRUD ─────────────────────────────────── */
  const openNewPage = (spreadsheetId: string) => {
    setEditingPage(null);
    setPageParentId(spreadsheetId);
    setPageForm({ ...emptyPage, spreadsheet_id: spreadsheetId });
    setPageDialog(true);
  };

  const openEditPage = (p: SpreadsheetPage) => {
    setEditingPage(p);
    setPageParentId(p.spreadsheet_id);
    setPageForm({
      tab_name: p.tab_name,
      col_car_name: p.col_car_name,
      col_price: p.col_price,
      col_category: p.col_category,
      col_image: p.col_image,
      active: p.active,
      spreadsheet_id: p.spreadsheet_id,
    });
    setPageDialog(true);
  };

  const savePage = async () => {
    setPageSaving(true);
    setError("");
    try {
      if (editingPage) {
        await api.updatePage(editingPage.id, {
          tab_name: pageForm.tab_name,
          col_car_name: pageForm.col_car_name,
          col_price: pageForm.col_price,
          col_category: pageForm.col_category,
          col_image: pageForm.col_image,
          active: pageForm.active,
        });
      } else {
        await api.createPage({
          spreadsheet_id: pageParentId,
          tab_name: pageForm.tab_name,
          col_car_name: pageForm.col_car_name,
          col_price: pageForm.col_price,
          col_category: pageForm.col_category,
          col_image: pageForm.col_image,
          active: pageForm.active,
        });
      }
      setPageDialog(false);
      await load();
      flash(editingPage ? "Página atualizada!" : "Página adicionada!");
      setExpanded((prev) => new Set(prev).add(pageParentId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setPageSaving(false);
    }
  };

  /* ── Delete ────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      if (deleteTarget.type === "sheet") {
        await api.deleteSpreadsheet(deleteTarget.id, deleteTarget.name);
      } else {
        await api.deletePage(deleteTarget.id);
      }
      setDeleteTarget(null);
      await load();
      flash(`${deleteTarget.type === "sheet" ? "Planilha" : "Página"} excluída!`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
      setDeleteTarget(null);
    }
  };

  /* ── Render ────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const sheetsContent = (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planilhas</h1>
          <p className="text-slate-500 mt-1">
            Gerencie as planilhas Google Sheets conectadas ao site
          </p>
        </div>
        <Button onClick={openNewSheet}>
          <Plus className="mr-2" size={16} />
          Nova Planilha
        </Button>
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

      {sheets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileSpreadsheet className="mx-auto mb-4 text-slate-300" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhuma planilha cadastrada
          </h3>
          <p className="text-slate-500 mb-6">
            Adicione uma planilha Google Sheets para exibir os modelos no site.
          </p>
          <Button onClick={openNewSheet}>
            <Plus className="mr-2" size={16} />
            Adicionar Planilha
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => {
            const isExpanded = expanded.has(sheet.id);
            return (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Header da planilha */}
                <div className="flex items-center gap-4 p-5">
                  <button
                    onClick={() => toggle(sheet.id)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>

                  <FileSpreadsheet
                    size={22}
                    className={sheet.active ? "text-green-500" : "text-slate-300"}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {sheet.name}
                      </h3>
                      <Badge variant={sheet.active ? "default" : "secondary"}>
                        {sheet.active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge variant="outline">
                        {sheet.pages.length}{" "}
                        {sheet.pages.length === 1 ? "página" : "páginas"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono truncate">
                      ID: {sheet.sheet_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sheet.active}
                      onCheckedChange={() => toggleSheetActive(sheet)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSheet(sheet)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setDeleteTarget({
                          type: "sheet",
                          id: sheet.id,
                          name: sheet.name,
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Páginas expandidas */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Table2 size={16} />
                        Páginas / Abas
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNewPage(sheet.id)}
                      >
                        <Plus className="mr-1.5" size={14} />
                        Nova Página
                      </Button>
                    </div>

                    {sheet.pages.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Nenhuma página cadastrada nesta planilha.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {sheet.pages.map((page) => (
                          <div
                            key={page.id}
                            className="bg-white rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-slate-900">
                                    {page.tab_name}
                                  </span>
                                  <Badge
                                    variant={
                                      page.active ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {page.active ? "Ativa" : "Inativa"}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Columns3 size={12} />
                                    Carro: <code className="bg-slate-100 px-1 rounded">{page.col_car_name}</code>
                                  </span>
                                  <span>
                                    Preço: <code className="bg-slate-100 px-1 rounded">{page.col_price}</code>
                                  </span>
                                  {page.col_category && (
                                    <span>
                                      Categoria: <code className="bg-slate-100 px-1 rounded">{page.col_category}</code>
                                    </span>
                                  )}
                                  {page.col_image && (
                                    <span>
                                      Imagem: <code className="bg-slate-100 px-1 rounded">{page.col_image}</code>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditPage(page)}
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "page",
                                      id: page.id,
                                      name: page.tab_name,
                                    })
                                  }
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog: Nova/Editar Planilha ─────────────── */}
      <Dialog open={sheetDialog} onOpenChange={setSheetDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSheet ? "Editar Planilha" : "Nova Planilha"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="s-name">Nome da Planilha</Label>
              <Input
                id="s-name"
                placeholder="Ex: Tabela de Preços 2026"
                value={sheetForm.name}
                onChange={(e) =>
                  setSheetForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="s-apikey">API Key do Google Sheets</Label>
              <div className="relative mt-1.5">
                <Input
                  id="s-apikey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={sheetForm.api_key}
                  onChange={(e) =>
                    setSheetForm((f) => ({ ...f, api_key: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="s-sheetid">ID da Planilha</Label>
              <Input
                id="s-sheetid"
                placeholder="1MOrbjuE9CLb..."
                value={sheetForm.sheet_id}
                onChange={(e) =>
                  setSheetForm((f) => ({ ...f, sheet_id: e.target.value }))
                }
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                O ID fica na URL: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSheetDialog(false)}
              disabled={sheetSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveSheet}
              disabled={sheetSaving || !sheetForm.name || !sheetForm.sheet_id}
            >
              {sheetSaving && <Loader2 className="animate-spin mr-2" size={16} />}
              {editingSheet ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nova/Editar Página ───────────────── */}
      <Dialog open={pageDialog} onOpenChange={setPageDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Editar Página" : "Nova Página"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="p-tab">Nome da Aba</Label>
              <Input
                id="p-tab"
                placeholder="Ex: TABELA_PRECOS"
                value={pageForm.tab_name}
                onChange={(e) =>
                  setPageForm((f) => ({ ...f, tab_name: e.target.value }))
                }
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                Nome exato da aba/página na planilha Google Sheets
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="p-active">Página ativa</Label>
              <Switch
                id="p-active"
                checked={pageForm.active}
                onCheckedChange={(v) =>
                  setPageForm((f) => ({ ...f, active: v }))
                }
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Columns3 size={16} />
                Mapeamento de Colunas
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Informe o nome exato do cabeçalho de cada coluna na planilha.
              </p>

              <div className="grid gap-3">
                <div>
                  <Label htmlFor="p-col-car" className="text-xs">
                    Coluna do Nome do Carro *
                  </Label>
                  <Input
                    id="p-col-car"
                    placeholder="Ex: Modelo-Versão"
                    value={pageForm.col_car_name}
                    onChange={(e) =>
                      setPageForm((f) => ({
                        ...f,
                        col_car_name: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="p-col-price" className="text-xs">
                    Coluna do Preço *
                  </Label>
                  <Input
                    id="p-col-price"
                    placeholder="Ex: Valor"
                    value={pageForm.col_price}
                    onChange={(e) =>
                      setPageForm((f) => ({ ...f, col_price: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="p-col-cat" className="text-xs">
                    Coluna da Categoria{" "}
                    <span className="text-slate-400">(opcional)</span>
                  </Label>
                  <Input
                    id="p-col-cat"
                    placeholder="Ex: Categoria"
                    value={pageForm.col_category}
                    onChange={(e) =>
                      setPageForm((f) => ({
                        ...f,
                        col_category: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="p-col-img" className="text-xs">
                    Coluna da Imagem{" "}
                    <span className="text-slate-400">(opcional)</span>
                  </Label>
                  <Input
                    id="p-col-img"
                    placeholder="Ex: Imagem"
                    value={pageForm.col_image}
                    onChange={(e) =>
                      setPageForm((f) => ({ ...f, col_image: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageDialog(false)}
              disabled={pageSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={savePage}
              disabled={
                pageSaving ||
                !pageForm.tab_name ||
                !pageForm.col_car_name ||
                !pageForm.col_price
              }
            >
              {pageSaving && <Loader2 className="animate-spin mr-2" size={16} />}
              {editingPage ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Confirmar exclusão ──────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === "sheet" &&
                " Todas as páginas desta planilha também serão excluídas."}
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
    </>
  );

  return (
    <Tabs defaultValue="sheets" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="sheets" className="gap-2">
          <FileSpreadsheet size={16} />
          Planilhas
        </TabsTrigger>
        <TabsTrigger value="images" className="gap-2">
          <ImageIcon size={16} />
          Fotos dos Carros
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sheets">{sheetsContent}</TabsContent>
      <TabsContent value="images">
        <CarImagesTab />
      </TabsContent>
    </Tabs>
  );
};

export default SpreadsheetsPage;
