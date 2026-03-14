import { useState, useEffect, useCallback, useRef } from "react";
import { api, type CarImage } from "@/services/api";
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
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";

const CarImagesTab = () => {
  const [images, setImages] = useState<CarImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Dialog */
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CarImage | null>(null);
  const [carName, setCarName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<CarImage | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getCarImages();
      setImages(data);
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

  /* ── Open dialogs ──────────────────────────────── */
  const openNew = () => {
    setEditing(null);
    setCarName("");
    setImageUrl("");
    setPreviewFile(null);
    setPreviewSrc("");
    setDialog(true);
  };

  const openEdit = (img: CarImage) => {
    setEditing(img);
    setCarName(img.car_name);
    setImageUrl(img.image_url);
    setPreviewFile(null);
    setPreviewSrc(img.image_url);
    setDialog(true);
  };

  /* ── File selection ────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    setImageUrl("");
  };

  const clearFile = () => {
    setPreviewFile(null);
    setPreviewSrc(editing?.image_url ?? "");
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Save ──────────────────────────────────────── */
  const handleSave = async () => {
    if (!carName.trim()) return;
    setSaving(true);
    setError("");

    try {
      let finalUrl = imageUrl;

      if (previewFile) {
        finalUrl = await api.uploadCarPhoto(previewFile);
      }

      if (!finalUrl) {
        setError("Selecione uma imagem ou cole uma URL");
        setSaving(false);
        return;
      }

      if (editing) {
        await api.updateCarImage(editing.id, {
          car_name: carName.trim(),
          image_url: finalUrl,
        });
      } else {
        await api.createCarImage({
          car_name: carName.trim(),
          image_url: finalUrl,
        });
      }

      setDialog(false);
      await load();
      flash(editing ? "Foto atualizada!" : "Foto cadastrada!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ────────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      if (deleteTarget.image_url.includes("/car-images/")) {
        await api.deleteCarPhoto(deleteTarget.image_url);
      }
      await api.deleteCarImage(deleteTarget.id, deleteTarget.car_name);
      setDeleteTarget(null);
      await load();
      flash("Foto excluída!");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fotos dos Carros</h1>
          <p className="text-slate-500 mt-1">
            Cadastre a imagem de cada carro. O nome deve coincidir com o nome exibido no site.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2" size={16} />
          Nova Foto
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

      {images.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ImageIcon className="mx-auto mb-4 text-slate-300" size={48} />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhuma foto cadastrada
          </h3>
          <p className="text-slate-500 mb-6">
            Adicione fotos dos carros para exibir no site. Carros sem foto exibirão
            a logo da Multi Experiências.
          </p>
          <Button onClick={openNew}>
            <Plus className="mr-2" size={16} />
            Adicionar Foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 relative">
                {img.image_url ? (
                  <img
                    src={img.image_url}
                    alt={img.car_name}
                    className="w-full h-full object-contain p-3"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="text-slate-300" size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-md"
                    onClick={() => openEdit(img)}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-md text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteTarget(img)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100">
                <p className="font-semibold text-slate-900 truncate">
                  {img.car_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dialog: Nova/Editar Foto ─────────────────── */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Foto" : "Nova Foto de Carro"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="ci-name">Nome do Carro</Label>
              <Input
                id="ci-name"
                placeholder="Ex: Fiat Toro"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                Use o mesmo nome que aparece no site (ex: Fiat Toro, GWM Tank, Ford Ranger)
              </p>
            </div>

            {/* Preview */}
            {previewSrc && (
              <div className="relative rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="max-h-48 mx-auto object-contain"
                />
                {previewFile && (
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-slate-200 hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Upload */}
            <div>
              <Label>Upload de Imagem</Label>
              <div
                className="mt-1.5 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm text-slate-600">
                  Clique para selecionar uma imagem
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG ou WebP (preferencialmente com fundo transparente)
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Or URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">ou cole a URL</span>
              </div>
            </div>

            <div>
              <Input
                placeholder="https://exemplo.com/imagem.png"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewSrc(e.target.value);
                  setPreviewFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !carName.trim() || (!previewFile && !imageUrl)}
            >
              {saving && <Loader2 className="animate-spin mr-2" size={16} />}
              {editing ? "Salvar" : "Cadastrar"}
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
              Tem certeza que deseja excluir a foto de{" "}
              <strong>{deleteTarget?.car_name}</strong>?
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

export default CarImagesTab;
