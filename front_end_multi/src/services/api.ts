import { supabase, supabaseIsolated } from "@/lib/supabase";

/* ── Interfaces ──────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "gerente" | "marketing" | "analista";
}

export interface SettingItem {
  key: string;
  value: string;
  label: string;
  category: string;
  updated_at: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

export interface AuditItem {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Spreadsheet {
  id: string;
  name: string;
  api_key: string;
  sheet_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpreadsheetPage {
  id: string;
  spreadsheet_id: string;
  tab_name: string;
  col_car_name: string;
  col_price: string;
  col_category: string;
  col_image: string;
  active: boolean;
  created_at: string;
}

export interface CarImage {
  id: string;
  car_name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

/* ── Helpers ─────────────────────────────────────────── */

async function currentUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

async function auditLog(action: string, details: string) {
  const uid = await currentUserId();
  await supabase.from("audit_log").insert({ user_id: uid, action, details });
}

async function enrichAuditRows(rows: Array<{ id: number; user_id: string; action: string; details: string; created_at: string }>): Promise<AuditItem[]> {
  const userIds = [...new Set(rows.map((d) => d.user_id).filter(Boolean))];
  let profileMap = new Map<string, { name: string; email: string }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, { name: p.name, email: p.email ?? "" }]),
    );
  }

  return rows.map((d) => ({
    id: d.id,
    user_id: d.user_id,
    user_name: profileMap.get(d.user_id)?.name ?? "Sistema",
    user_email: profileMap.get(d.user_id)?.email ?? "",
    action: d.action,
    details: d.details ?? "",
    created_at: d.created_at,
  }));
}

/* ── API ─────────────────────────────────────────────── */

export const api = {
  /* Settings */
  getSettings: async (): Promise<SettingItem[]> => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("category");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  saveSettings: async (settings: { key: string; value: string }[]): Promise<void> => {
    const uid = await currentUserId();
    const now = new Date().toISOString();

    for (const s of settings) {
      const { error } = await supabase
        .from("settings")
        .update({ value: s.value, updated_by: uid, updated_at: now })
        .eq("key", s.key);
      if (error) throw new Error(error.message);
    }

    await auditLog("settings_update", `Atualizou: ${settings.map((s) => s.key).join(", ")}`);
  },

  /* Users */
  getUsers: async (): Promise<UserItem[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email ?? "",
      role: p.role,
      active: p.active,
      created_at: p.created_at,
    }));
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<void> => {
    const { error } = await supabaseIsolated.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, role: data.role },
      },
    });
    if (error) throw new Error(error.message);

    await auditLog("user_create", `Criou usuário: ${data.email} (${data.role})`);
  },

  updateUser: async (id: string, data: Partial<UserItem>): Promise<void> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.role !== undefined) updates.role = data.role;
    if (data.active !== undefined) updates.active = data.active;
    if (data.name !== undefined) updates.name = data.name;

    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
  },

  resetPassword: async (_id: string, email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /* Spreadsheets */
  getSpreadsheets: async (): Promise<(Spreadsheet & { pages: SpreadsheetPage[] })[]> => {
    const { data, error } = await supabase
      .from("spreadsheets")
      .select("*, spreadsheet_pages(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((s) => ({
      ...s,
      pages: (s.spreadsheet_pages ?? []).sort(
        (a: SpreadsheetPage, b: SpreadsheetPage) => a.tab_name.localeCompare(b.tab_name),
      ),
    }));
  },

  createSpreadsheet: async (d: { name: string; api_key: string; sheet_id: string }): Promise<Spreadsheet> => {
    const { data, error } = await supabase
      .from("spreadsheets")
      .insert(d)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("spreadsheet_create", `Criou planilha: ${d.name}`);
    return data;
  },

  updateSpreadsheet: async (id: string, d: Partial<Spreadsheet>): Promise<void> => {
    const { error } = await supabase
      .from("spreadsheets")
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("spreadsheet_update", `Atualizou planilha: ${d.name ?? id}`);
  },

  deleteSpreadsheet: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase.from("spreadsheets").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("spreadsheet_delete", `Excluiu planilha: ${name}`);
  },

  createPage: async (d: Omit<SpreadsheetPage, "id" | "created_at">): Promise<SpreadsheetPage> => {
    const { data, error } = await supabase
      .from("spreadsheet_pages")
      .insert(d)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updatePage: async (id: string, d: Partial<SpreadsheetPage>): Promise<void> => {
    const { error } = await supabase
      .from("spreadsheet_pages")
      .update(d)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  deletePage: async (id: string): Promise<void> => {
    const { error } = await supabase.from("spreadsheet_pages").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /* Car Images */
  getCarImages: async (): Promise<CarImage[]> => {
    const { data, error } = await supabase
      .from("car_images")
      .select("*")
      .order("car_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createCarImage: async (d: { car_name: string; image_url: string }): Promise<CarImage> => {
    const { data, error } = await supabase
      .from("car_images")
      .insert(d)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("car_image_create", `Cadastrou foto: ${d.car_name}`);
    return data;
  },

  updateCarImage: async (id: string, d: { car_name?: string; image_url?: string }): Promise<void> => {
    const { error } = await supabase
      .from("car_images")
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  deleteCarImage: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase.from("car_images").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("car_image_delete", `Excluiu foto: ${name}`);
  },

  uploadCarPhoto: async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("car-images")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    return data.publicUrl;
  },

  deleteCarPhoto: async (url: string): Promise<void> => {
    const parts = url.split("/car-images/");
    if (parts.length < 2) return;
    await supabase.storage.from("car-images").remove([parts[1]]);
  },

  getAudit: async (limit = 50): Promise<AuditItem[]> => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return await enrichAuditRows(data ?? []);
  },

  getAuditFull: async (opts?: {
    limit?: number;
    offset?: number;
    search?: string;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ rows: AuditItem[]; total: number }> => {
    const { limit = 100, offset = 0, search, action, userId, dateFrom, dateTo } = opts ?? {};

    let query = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq("action", action);
    if (userId) query = query.eq("user_id", userId);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");
    if (search) query = query.ilike("details", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return { rows: await enrichAuditRows(data ?? []), total: count ?? 0 };
  },

  getAuditActions: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("action")
      .order("action");
    if (error) return [];
    const unique = [...new Set((data ?? []).map((d) => d.action))];
    return unique.sort();
  },
};
