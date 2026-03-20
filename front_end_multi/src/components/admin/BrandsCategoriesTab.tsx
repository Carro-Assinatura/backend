import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Tag, Layers, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Marca ───────────────────────────────────────── */
export const MarcaTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [nomeCarro, setNomeCarro] = useState("");
  const [marca, setMarca] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: mappings = new Map<string, string>(), isLoading } = useQuery({
    queryKey: ["car-brand-mappings"],
    queryFn: () => api.getCarBrandMappings(),
    staleTime: 30 * 1000,
  });

  const entries = Array.from(mappings.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const openNew = () => {
    setEditingKey(null);
    setNomeCarro("");
    setMarca("");
    setDialogOpen(true);
  };

  const openEdit = (key: string, value: string) => {
    setEditingKey(key);
    setNomeCarro(key);
    setMarca(value);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const n = nomeCarro.trim().toLowerCase();
    const m = marca.trim();
    if (!n || !m) {
      toast({ title: "Preencha nome do carro e marca", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.saveCarBrandMapping(n, m);
      if (editingKey && editingKey !== n) {
        await api.deleteCarBrandMapping(editingKey);
      }
      queryClient.invalidateQueries({ queryKey: ["car-brand-mappings"] });
      toast({ title: "Marca salva com sucesso" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCarBrandMapping(deleteTarget);
      queryClient.invalidateQueries({ queryKey: ["car-brand-mappings"] });
      toast({ title: "Marca excluída" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Vincule o nome do carro (como aparece na planilha) à marca. Usado na importação e no site.
        </p>
        <Button onClick={openNew}>
          <Plus className="mr-2" size={16} />
          Nova Marca
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <Tag className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500">Nenhum mapeamento de marca cadastrado.</p>
          <p className="text-sm text-slate-400 mt-1">
            Adicione manualmente ou aprenda durante a importação de planilhas.
          </p>
          <Button variant="outline" className="mt-4" onClick={openNew}>
            <Plus className="mr-2" size={16} />
            Cadastrar primeira marca
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">Nome do Carro</th>
                <th className="text-left p-4 font-semibold text-slate-700">Marca</th>
                <th className="w-24 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4 font-mono text-slate-800">{key}</td>
                  <td className="p-4 text-slate-700">{value}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(key, value)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(key)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Editar Marca" : "Nova Marca"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do carro (ex: commander, hilux)</Label>
              <Input
                placeholder="Ex: commander"
                value={nomeCarro}
                onChange={(e) => setNomeCarro(e.target.value)}
                className="mt-1.5"
                disabled={!!editingKey}
              />
              {editingKey && (
                <p className="text-xs text-slate-400 mt-1">Para alterar o nome, exclua e crie novamente.</p>
              )}
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                placeholder="Ex: Jeep, Toyota"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !nomeCarro.trim() || !marca.trim()}>
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapeamento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o mapeamento <strong>{deleteTarget}</strong>? Na próxima importação, será necessário informar a marca novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
              {deleting && <Loader2 className="animate-spin mr-2" size={16} />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ── Categoria ───────────────────────────────────── */
export const CategoriaTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [nomeCarro, setNomeCarro] = useState("");
  const [categoria, setCategoria] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: mappings = new Map<string, string>(), isLoading } = useQuery({
    queryKey: ["car-category-mappings"],
    queryFn: () => api.getCarCategoryMappings(),
    staleTime: 30 * 1000,
  });

  const entries = Array.from(mappings.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const openNew = () => {
    setEditingKey(null);
    setNomeCarro("");
    setCategoria("");
    setDialogOpen(true);
  };

  const openEdit = (key: string, value: string) => {
    setEditingKey(key);
    setNomeCarro(key);
    setCategoria(value);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const n = nomeCarro.trim().toLowerCase();
    const c = categoria.trim();
    if (!n || !c) {
      toast({ title: "Preencha nome do carro e categoria", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.saveCarCategoryMapping(n, c);
      if (editingKey && editingKey !== n) {
        await api.deleteCarCategoryMapping(editingKey);
      }
      queryClient.invalidateQueries({ queryKey: ["car-category-mappings"] });
      toast({ title: "Categoria salva com sucesso" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCarCategoryMapping(deleteTarget);
      queryClient.invalidateQueries({ queryKey: ["car-category-mappings"] });
      toast({ title: "Categoria excluída" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Vincule o nome do carro à categoria (ex: SUV, Sedan, Pickup). Usado na importação e na calculadora do site.
        </p>
        <Button onClick={openNew}>
          <Plus className="mr-2" size={16} />
          Nova Categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <Layers className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500">Nenhum mapeamento de categoria cadastrado.</p>
          <p className="text-sm text-slate-400 mt-1">
            Adicione manualmente ou aprenda durante a importação de planilhas.
          </p>
          <Button variant="outline" className="mt-4" onClick={openNew}>
            <Plus className="mr-2" size={16} />
            Cadastrar primeira categoria
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">Nome do Carro</th>
                <th className="text-left p-4 font-semibold text-slate-700">Categoria</th>
                <th className="w-24 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4 font-mono text-slate-800">{key}</td>
                  <td className="p-4 text-slate-700">{value}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(key, value)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(key)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do carro (ex: commander, hilux)</Label>
              <Input
                placeholder="Ex: commander"
                value={nomeCarro}
                onChange={(e) => setNomeCarro(e.target.value)}
                className="mt-1.5"
                disabled={!!editingKey}
              />
              {editingKey && (
                <p className="text-xs text-slate-400 mt-1">Para alterar o nome, exclua e crie novamente.</p>
              )}
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                placeholder="Ex: SUV, Sedan, Pickup"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !nomeCarro.trim() || !categoria.trim()}>
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapeamento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o mapeamento <strong>{deleteTarget}</strong>? Na próxima importação, será necessário informar a categoria novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
              {deleting && <Loader2 className="animate-spin mr-2" size={16} />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ── Componente principal ────────────────────────── */
const BrandsCategoriesTab = () => {
  return (
    <Tabs defaultValue="marca" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="marca" className="gap-2">
          <Tag size={16} />
          Marca
        </TabsTrigger>
        <TabsTrigger value="categoria" className="gap-2">
          <Layers size={16} />
          Categoria
        </TabsTrigger>
      </TabsList>
      <TabsContent value="marca">
        <MarcaTab />
      </TabsContent>
      <TabsContent value="categoria">
        <CategoriaTab />
      </TabsContent>
    </Tabs>
  );
};

export default BrandsCategoriesTab;
