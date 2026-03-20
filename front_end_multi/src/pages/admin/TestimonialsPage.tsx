import { useState, useEffect, useCallback, useRef } from "react";
import { api, Client, TestimonialWithClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_TEXT = 1000;

function getClientLabel(c: Client): string {
  if (c.person_type === "pj") return c.trade_name || c.company_name || "PJ";
  return c.full_name || "Cliente";
}

export default function TestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<TestimonialWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [testimonialText, setTestimonialText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialWithClient | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTestimonials = useCallback(async () => {
    try {
      const data = await api.getTestimonialsWithClients();
      setTestimonials(data);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao carregar depoimentos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadClients = useCallback(async (search: string) => {
    try {
      const { rows } = await api.getClients({
        search: search.trim() || undefined,
        limit: 30,
      });
      setClients(rows);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  useEffect(() => {
    if (!clientOpen) return;
    const t = setTimeout(() => loadClients(clientSearch), 200);
    return () => clearTimeout(t);
  }, [clientOpen, clientSearch, loadClients]);

  const resetForm = () => {
    setSelectedClient(null);
    setClientSearch("");
    setTestimonialText("");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

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
    if (!selectedClient) {
      toast({ title: "Erro", description: "Selecione um cliente", variant: "destructive" });
      return;
    }
    if (!testimonialText.trim()) {
      toast({ title: "Erro", description: "Digite o depoimento", variant: "destructive" });
      return;
    }
    if (testimonialText.length > MAX_TEXT) {
      toast({ title: "Erro", description: `O depoimento deve ter no máximo ${MAX_TEXT} caracteres`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await api.uploadTestimonialPhoto(photoFile);
      }
      await api.createTestimonial({
        client_id: selectedClient.id,
        delivery_photo_url: photoUrl,
        testimonial_text: testimonialText.trim(),
      });
      toast({ title: "Sucesso", description: "Depoimento cadastrado com sucesso" });
      resetForm();
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Depoimentos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cadastre depoimentos de clientes para exibir no site principal
        </p>
      </div>

      {/* Formulário de cadastro */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Novo depoimento</h2>

        <div className="space-y-2">
          <Label>Cliente</Label>
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={clientOpen}
                className="w-full justify-between font-normal"
              >
                {selectedClient ? getClientLabel(selectedClient) : "Buscar cliente..."}
                <ChevronsUpDown size={16} className="ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Digite para buscar..."
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
                  <CommandGroup>
                    {clients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={getClientLabel(c)}
                        onSelect={() => {
                          setSelectedClient(c);
                          setClientSearch("");
                          setClientOpen(false);
                        }}
                      >
                        {getClientLabel(c)}
                        {c.person_type === "pj" && c.responsible_name && (
                          <span className="text-slate-400 ml-2 text-xs">({c.responsible_name})</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Foto da entrega do carro</Label>
          <div className="flex items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} className="mr-1" /> Selecionar imagem
            </Button>
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
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
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Digite o depoimento do cliente..."
            value={testimonialText}
            onChange={(e) => setTestimonialText(e.target.value)}
            maxLength={MAX_TEXT}
          />
          <div className="text-xs text-slate-500 text-right">
            {testimonialText.length} / {MAX_TEXT}
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Plus size={16} className="mr-1" />}
          Cadastrar depoimento
        </Button>
      </form>

      {/* Lista de depoimentos */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-800">Depoimentos cadastrados</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum depoimento cadastrado</div>
        ) : (
          <div className="divide-y">
            {testimonials.map((t) => (
              <div key={t.id} className="p-4 flex gap-4 items-start">
                <div className="shrink-0">
                  {t.delivery_photo_url ? (
                    <img
                      src={t.delivery_photo_url}
                      alt="Foto entrega"
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border bg-slate-100 flex items-center justify-center">
                      <ImageIcon size={24} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 line-clamp-3">"{t.testimonial_text}"</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.client?.person_type === "pj"
                      ? t.client?.trade_name || t.client?.company_name
                      : t.client?.full_name || "Cliente"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2 size={18} />
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
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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
