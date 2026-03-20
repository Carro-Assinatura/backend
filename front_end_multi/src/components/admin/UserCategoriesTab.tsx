import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type UserRole, PERMISSION_KEYS } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, Plus, Pencil, Trash2, Shield, Lock, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserCategoriesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "permissions" | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formKey, setFormKey] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRole | null>(null);
  const [usersCount, setUsersCount] = useState<Record<string, number>>({});

  const { data: rolesData = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () => api.getRoles(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    setRoles(rolesData);
    setLoading(false);
  }, [rolesData]);

  useEffect(() => {
    if (dialogMode === "permissions" && editingRole) {
      api.getRolePermissions(editingRole.key).then(setPermissions);
    }
  }, [dialogMode, editingRole]);

  useEffect(() => {
    if (roles.length > 0) {
      Promise.all(roles.map((r) => api.getUsersCountByRole(r.key))).then((counts) => {
        const map: Record<string, number> = {};
        roles.forEach((r, i) => {
          map[r.key] = counts[i] ?? 0;
        });
        setUsersCount(map);
      });
    }
  }, [roles]);

  const openCreate = () => {
    setEditingRole(null);
    setFormLabel("");
    setFormKey("");
    setDialogMode("create");
  };

  const openEdit = (role: UserRole) => {
    if (role.is_system) return;
    setEditingRole(role);
    setFormLabel(role.label);
    setFormKey(role.key);
    setDialogMode("edit");
  };

  const openPermissions = (role: UserRole) => {
    if (role.is_system) return;
    setEditingRole(role);
    setPermissions({});
    setDialogMode("permissions");
  };

  const openDelete = (role: UserRole) => {
    setDeleteTarget(role);
  };

  const handleSaveRole = async () => {
    if (dialogMode === "create") {
      if (!formLabel.trim()) {
        toast({ title: "Nome obrigatório", variant: "destructive" });
        return;
      }
      setSaving(true);
      try {
        await api.createRole({ key: formKey || formLabel, label: formLabel.trim() });
        await queryClient.invalidateQueries({ queryKey: ["user-roles"] });
        toast({ title: "Nível criado com sucesso" });
        setDialogMode(null);
      } catch (e) {
        toast({ title: "Erro", description: e instanceof Error ? e.message : "Não foi possível criar", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    } else if (dialogMode === "edit" && editingRole) {
      setSaving(true);
      try {
        await api.updateRole(editingRole.key, { label: formLabel.trim() });
        await queryClient.invalidateQueries({ queryKey: ["user-roles"] });
        toast({ title: "Nível atualizado" });
        setDialogMode(null);
      } catch (e) {
        toast({ title: "Erro", description: e instanceof Error ? e.message : "Não foi possível atualizar", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const fullPerms: Record<string, boolean> = {};
      for (const p of PERMISSION_KEYS) {
        fullPerms[p.key] = permissions[p.key] ?? false;
      }
      await api.saveRolePermissions(editingRole.key, fullPerms);
      await queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Permissões salvas" });
      setDialogMode(null);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Não foi possível salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteRole(deleteTarget.key);
      await queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Nível excluído" });
      setDeleteTarget(null);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Não foi possível excluir", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const groupedPerms = PERMISSION_KEYS.reduce<Record<string, typeof PERMISSION_KEYS>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Categoria de Usuário</h2>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie os níveis de acesso e as permissões de cada categoria. O Administrador tem acesso total e não pode ser alterado.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Novo nível de acesso
        </Button>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.key;
          const count = usersCount[role.key] ?? 0;
          const canDelete = !role.is_system && count === 0;

          return (
            <div
              key={role.key}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedRole(isExpanded ? null : role.key)}
              >
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                {role.is_system ? (
                  <Lock size={20} className="text-amber-500 shrink-0" />
                ) : (
                  <Shield size={20} className="text-slate-400 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-semibold text-slate-900">{role.label}</span>
                  <span className="text-slate-400 text-sm ml-2">({role.key})</span>
                  {role.is_system && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Protegido</span>
                  )}
                </div>
                <span className="text-sm text-slate-500">{count} usuário(s)</span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {!role.is_system && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openPermissions(role)} title="Permissões">
                        <Shield size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(role)} title="Editar">
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDelete(role)}
                        disabled={!canDelete}
                        title={!canDelete ? "Excluir apenas se não houver usuários" : "Excluir"}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-sm text-slate-600">
                    {role.is_system
                      ? "O Administrador tem acesso irrestrito a todos os menus e funcionalidades do sistema."
                      : "Configure as permissões deste nível clicando no ícone de escudo."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog: Criar / Editar */}
      <Dialog open={dialogMode === "create" || dialogMode === "edit"} onOpenChange={(v) => !v && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Novo nível de acesso" : "Editar nível"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Crie um novo nível de acesso. A chave será gerada automaticamente a partir do nome."
                : "Altere o nome exibido do nível de acesso."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do nível</Label>
              <Input
                value={formLabel}
                onChange={(e) => {
                  setFormLabel(e.target.value);
                  if (dialogMode === "create") setFormKey(e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
                }}
                placeholder="Ex: Vendedor"
                disabled={dialogMode === "edit"}
              />
            </div>
            {dialogMode === "create" && (
              <div>
                <Label>Chave (identificador)</Label>
                <Input value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="Ex: vendedor" className="font-mono text-sm" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Permissões */}
      <Dialog open={dialogMode === "permissions"} onOpenChange={(v) => !v && setDialogMode(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões — {editingRole?.label}</DialogTitle>
            <DialogDescription>
              Marque as permissões que este nível de acesso terá. Desmarque para negar acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {Object.entries(groupedPerms).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{group}</h4>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div key={p.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <Label htmlFor={`perm-${p.key}`} className="cursor-pointer flex-1">
                        {p.label}
                      </Label>
                      <Switch
                        id={`perm-${p.key}`}
                        checked={permissions[p.key] ?? false}
                        onCheckedChange={(v) => setPermissions((prev) => ({ ...prev, [p.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin mr-2" />}
              Salvar permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nível de acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.label}&quot;? Esta ação não pode ser desfeita.
              {deleteTarget && usersCount[deleteTarget.key] > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Não é possível excluir: existem {usersCount[deleteTarget.key]} usuário(s) com este nível.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTarget ? usersCount[deleteTarget.key] > 0 : false}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserCategoriesTab;
