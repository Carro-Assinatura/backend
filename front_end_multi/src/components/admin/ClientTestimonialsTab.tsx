import { useState, useEffect, useCallback, useRef } from "react";
import { api, Testimonial } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const MAX_TEXT = 1000;

interface ClientTestimonialsTabProps {
  clientId: string;
}

export default function ClientTestimonialsTab({ clientId }: ClientTestimonialsTabProps) {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonialText, setTestimonialText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTestimonials({ clientId });
      setTestimonials(data);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao carregar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione uma imagem (PNG, JPEG, etc.)", variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialText.trim()) {
      toast({ title: "Erro", description: "Digite o depoimento", variant: "destructive" });
      return;
    }
    if (testimonialText.length > MAX_TEXT) {
      toast({ title: "Erro", description: `Máximo ${MAX_TEXT} caracteres`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await api.uploadTestimonialPhoto(photoFile);
      }
      await api.createTestimonial({
        client_id: clientId,
        delivery_photo_url: photoUrl,
        testimonial_text: testimonialText.trim(),
      });
      toast({ title: "Sucesso", description: "Depoimento cadastrado" });
      setTestimonialText("");
      setPhotoFile(null);
      setPhotoPreview("");
      if (fileRef.current) fileRef.current.value = "";
      loadTestimonials();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTestimonial(deleteTarget.id);
      toast({ title: "Sucesso", description: "Depoimento excluído" });
      setDeleteTarget(null);
      loadTestimonials();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao excluir", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-medium text-slate-800">Novo depoimento</h3>
        <div className="space-y-2">
          <Label>Foto da entrega do carro</Label>
          <div className="flex items-center gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={16} className="mr-1" /> Selecionar imagem
            </Button>
            {photoPreview && (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Depoimento (máx. {MAX_TEXT} caracteres)</Label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Digite o depoimento..."
            value={testimonialText}
            onChange={(e) => setTestimonialText(e.target.value)}
            maxLength={MAX_TEXT}
          />
          <div className="text-xs text-slate-500 text-right">{testimonialText.length} / {MAX_TEXT}</div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : null}
          Cadastrar depoimento
        </Button>
      </form>

      <div>
        <h3 className="font-medium text-slate-800 mb-3">Depoimentos deste cliente</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">Nenhum depoimento cadastrado</p>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t) => (
              <div key={t.id} className="flex gap-4 items-start p-3 border rounded-lg">
                <div className="shrink-0">
                  {t.delivery_photo_url ? (
                    <img src={t.delivery_photo_url} alt="Foto" className="h-14 w-14 object-cover rounded-lg border" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg border bg-slate-100 flex items-center justify-center">
                      <ImageIcon size={20} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 line-clamp-3">&quot;{t.testimonial_text}&quot;</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir depoimento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
