import { useState, useEffect } from "react";
import { api, type UserItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  UserCog,
  Shield,
  Trash2,
  KeyRound,
  X,
} from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "marketing", label: "Marketing" },
  { value: "analista", label: "Analista" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  gerente: "bg-blue-100 text-blue-700",
  marketing: "bg-purple-100 text-purple-700",
  analista: "bg-slate-100 text-slate-700",
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "analista" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = () => {
    api.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      await api.createUser(formData);
      setFormData({ name: "", email: "", password: "", role: "analista" });
      setShowForm(false);
      loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    if (user.active) {
      if (!confirm(`Desativar ${user.name}?`)) return;
      await api.deleteUser(user.id);
    } else {
      await api.updateUser(user.id, { active: true } as Partial<UserItem>);
    }
    loadUsers();
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!confirm(`Enviar email de redefinição de senha para ${user.email}?`)) return;
    try {
      await api.resetPassword(user.id, user.email);
      alert("Email de redefinição enviado com sucesso!");
    } catch {
      alert("Erro ao enviar email de redefinição");
    }
  };

  const handleChangeRole = async (user: UserItem, newRole: string) => {
    await api.updateUser(user.id, { role: newRole } as Partial<UserItem>);
    loadUsers();
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500 mt-1">Gerencie os acessos à intranet</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
          {showForm ? "Cancelar" : "Novo Usuário"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Criar Novo Usuário</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nível de acesso</Label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {formError && (
              <div className="md:col-span-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{formError}</div>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                Criar Usuário
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Nível</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? "opacity-50" : ""}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${ROLE_COLORS[u.role] || "bg-slate-100"}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Resetar senha" onClick={() => handleResetPassword(u)}>
                        <KeyRound size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" title={u.active ? "Desativar" : "Reativar"} onClick={() => handleToggleActive(u)}>
                        {u.active ? <Trash2 size={15} className="text-red-500" /> : <Shield size={15} className="text-green-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
