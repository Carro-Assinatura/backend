import { supabase, supabaseIsolated } from "@/lib/supabase";

/* ── Interfaces ──────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
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

export interface UserRole {
  id: string;
  key: string;
  label: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_key: string;
  permission_key: string;
  granted: boolean;
}

export const PERMISSION_KEYS = [
  { key: "menu_dashboard", label: "Visão Geral (Dashboard)", group: "Menus" },
  { key: "menu_fin_camp", label: "Fin Camp", group: "Menus" },
  { key: "menu_planilhas", label: "Planilhas", group: "Menus" },
  { key: "menu_tracking", label: "Tracking", group: "Menus" },
  { key: "menu_bot_config", label: "Configuração do Bot", group: "Menus" },
  { key: "menu_clients", label: "Clientes (CRM)", group: "Menus" },
  { key: "menu_testimonials", label: "Depoimentos", group: "Menus" },
  { key: "menu_settings", label: "Configurações", group: "Menus" },
  { key: "menu_users", label: "Usuários", group: "Menus" },
  { key: "menu_logs", label: "Log de Auditoria", group: "Menus" },
  { key: "perm_config_geral", label: "Editar configurações gerais", group: "Configurações" },
  { key: "perm_config_logo", label: "Alterar logo da empresa", group: "Configurações" },
  { key: "perm_config_categorias", label: "Gerenciar categorias de usuário", group: "Configurações" },
  { key: "perm_usuarios_criar", label: "Criar usuários", group: "Usuários" },
  { key: "perm_usuarios_editar", label: "Editar usuários", group: "Usuários" },
  { key: "perm_usuarios_excluir", label: "Excluir/desativar usuários", group: "Usuários" },
  { key: "perm_planilhas_importar", label: "Importar planilhas de preços", group: "Planilhas" },
  { key: "perm_planilhas_excluir", label: "Excluir preços importados", group: "Planilhas" },
  { key: "perm_clientes_criar", label: "Criar clientes", group: "Clientes" },
  { key: "perm_clientes_editar", label: "Editar clientes", group: "Clientes" },
  { key: "perm_clientes_excluir", label: "Excluir clientes", group: "Clientes" },
] as const;

export interface PageStats {
  month: number;
  today: number;
  online: number;
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

export type TrackingType = "gtm" | "google_analytics" | "clarity" | "mixpanel" | "hubspot" | "bigquery" | "metabase";

export interface TrackingSystem {
  id: string;
  name: string;
  type: TrackingType;
  active: boolean;
  credentials: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface BotConfig {
  id: string;
  active: boolean;
  webhook_url: string;
  initial_messages: string[];
  show_welcome_screen: boolean;
  i18n_title: string;
  i18n_subtitle: string;
  i18n_input_placeholder: string;
  i18n_get_started: string;
  mode: "window" | "fullscreen";
  enable_streaming: boolean;
  theme_primary_color: string;
  load_previous_session: boolean;
  created_at: string;
  updated_at: string;
}

export interface UtmLink {
  id: string;
  name: string;
  description: string;
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  full_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  person_type: "pf" | "pj";
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string | null;
  marital_status: string;
  occupation: string;
  monthly_income: number;
  company_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  responsible_name: string;
  responsible_cpf: string;
  responsible_role: string;
  responsible_birth_date: string | null;
  responsible_marital_status: string;
  responsible_occupation: string;
  delivery_city: string;
  delivery_state: string;
  desired_color: string;
  email: string;
  phone: string;
  phone2: string;
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  credit_status: "pendente" | "em_analise" | "aprovado" | "reprovado";
  credit_amount: number;
  credit_analysis_date: string | null;
  credit_notes: string;
  contract_start: string | null;
  contract_end: string | null;
  contract_status: "sem_contrato" | "ativo" | "renovacao_pendente" | "cancelado" | "encerrado";
  contract_vehicle: string;
  contract_monthly: number;
  funnel_stage: "visitante" | "lead" | "qualificado" | "proposta" | "negociacao" | "fechamento" | "cliente";
  purchase_proximity: number;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
  notes: string;
  tags: string[];
  is_partial: boolean;
  visitor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  doc_type: string;
  doc_name: string;
  file_url: string;
  page_count: number;
  status: "pendente" | "aprovado" | "reprovado";
  notes: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  client_id: string;
  delivery_photo_url: string;
  testimonial_text: string;
  created_at: string;
  updated_at: string;
}

export interface TestimonialWithClient extends Testimonial {
  client: Pick<Client, "full_name" | "person_type" | "occupation" | "responsible_occupation" | "responsible_role" | "company_name" | "responsible_name" | "trade_name">;
}

export interface CarPrice {
  id: string;
  marca: string;
  nome_carro: string;
  modelo_carro: string;
  categoria: string;
  prazo_contrato: string | number | null;
  franquia_km_mes: string | number | null;
  tipo_pintura: string;
  troca_pneus: string;
  manutencao: string;
  seguro: string;
  carro_reserva: string;
  insulfilm: string;
  valor_km_excedido: string;
  valor_mensal_locacao: string | number | null;
  source_sheet: string;
  source_row: number;
  created_at: string;
  updated_at: string;
}

export interface ClientTrackingEvent {
  id: number;
  client_id: string | null;
  visitor_id: string;
  event_type: string;
  page_url: string;
  page_title: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device: string;
  browser: string;
  os: string;
  screen_resolution: string;
  session_id: string;
  duration_seconds: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/* ── Helpers ─────────────────────────────────────────── */

const DATE_FIELDS = ["birth_date", "responsible_birth_date", "credit_analysis_date", "contract_start", "contract_end"] as const;

function sanitizeClientDates<T extends Record<string, unknown>>(d: T): T {
  const out = { ...d };
  for (const key of DATE_FIELDS) {
    const v = (out as Record<string, unknown>)[key];
    if (v === "" || v === undefined) {
      (out as Record<string, unknown>)[key] = null;
    }
  }
  return out;
}

export function buildUtmUrl(
  baseUrl: string,
  params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }
): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "";
  const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  if (params.utm_source) url.searchParams.set("utm_source", params.utm_source);
  if (params.utm_medium) url.searchParams.set("utm_medium", params.utm_medium);
  if (params.utm_campaign) url.searchParams.set("utm_campaign", params.utm_campaign);
  if (params.utm_content) url.searchParams.set("utm_content", params.utm_content);
  if (params.utm_term) url.searchParams.set("utm_term", params.utm_term);
  return url.toString();
}

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

  getCarSource: async (): Promise<"planilhas" | "importar" | ""> => {
    const { data, error } = await supabaseIsolated
      .from("settings")
      .select("value")
      .eq("key", "car_source")
      .maybeSingle();
    if (error) return "";
    const v = (data?.value ?? "").trim();
    return v === "planilhas" || v === "importar" ? v : "";
  },

  setCarSource: async (value: "planilhas" | "importar" | ""): Promise<void> => {
    const uid = await currentUserId();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "car_source", value: value || "", label: "Fonte dos carros", category: "geral", updated_by: uid, updated_at: now },
        { onConflict: "key" }
      );
    if (error) throw new Error(error.message);
    await auditLog("car_source_update", `Fonte dos carros no site: ${value || "nenhuma"}`);
  },

  /* User Roles (Categorias de Usuário) */
  getRoles: async (): Promise<UserRole[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("sort_order", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createRole: async (d: { key: string; label: string }): Promise<UserRole> => {
    const key = d.key.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key) throw new Error("Chave inválida para o nível de acesso");
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ key, label: d.label.trim(), is_system: false, sort_order: 10 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("role_create", `Criou nível: ${d.label} (${key})`);
    return data;
  },

  updateRole: async (roleKey: string, d: { label?: string; sort_order?: number }): Promise<void> => {
    const { data: role } = await supabase.from("user_roles").select("is_system").eq("key", roleKey).single();
    if (role?.is_system) throw new Error("O nível Administrador não pode ser editado");
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (d.label !== undefined) updates.label = d.label;
    if (d.sort_order !== undefined) updates.sort_order = d.sort_order;
    const { error } = await supabase.from("user_roles").update(updates).eq("key", roleKey);
    if (error) throw new Error(error.message);
    await auditLog("role_update", `Atualizou nível: ${roleKey}`);
  },

  deleteRole: async (roleKey: string): Promise<void> => {
    const { data: role } = await supabase.from("user_roles").select("is_system").eq("key", roleKey).single();
    if (role?.is_system) throw new Error("O nível Administrador não pode ser excluído");
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", roleKey);
    if ((count ?? 0) > 0) throw new Error("Não é possível excluir: existem usuários com este nível de acesso");
    const { error } = await supabase.from("user_roles").delete().eq("key", roleKey);
    if (error) throw new Error(error.message);
    await auditLog("role_delete", `Excluiu nível: ${roleKey}`);
  },

  getRolePermissions: async (roleKey: string): Promise<Record<string, boolean>> => {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_key, granted")
      .eq("role_key", roleKey);
    if (error) return {};
    const map: Record<string, boolean> = {};
    for (const row of data ?? []) {
      map[row.permission_key] = row.granted;
    }
    return map;
  },

  saveRolePermissions: async (roleKey: string, permissions: Record<string, boolean>): Promise<void> => {
    const { data: role } = await supabase.from("user_roles").select("is_system").eq("key", roleKey).single();
    if (role?.is_system) throw new Error("O nível Administrador não pode ser alterado");
    const rows = Object.entries(permissions).map(([permission_key, granted]) => ({
      role_key: roleKey,
      permission_key,
      granted,
    }));
    const { error: delErr } = await supabase.from("role_permissions").delete().eq("role_key", roleKey);
    if (delErr) throw new Error(delErr.message);
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("role_permissions").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
    await auditLog("role_permissions_update", `Atualizou permissões: ${roleKey}`);
  },

  getUsersCountByRole: async (roleKey: string): Promise<number> => {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", roleKey);
    if (error) return 0;
    return count ?? 0;
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

  /* Tracking Systems */
  getTrackingSystems: async (): Promise<TrackingSystem[]> => {
    const { data, error } = await supabase
      .from("tracking_systems")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createTrackingSystem: async (d: { name: string; type: TrackingType; credentials: Record<string, string> }): Promise<TrackingSystem> => {
    const { data, error } = await supabase
      .from("tracking_systems")
      .insert(d)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("tracking_create", `Cadastrou tracking: ${d.name} (${d.type})`);
    return data;
  },

  updateTrackingSystem: async (id: string, d: Partial<TrackingSystem>): Promise<void> => {
    const { error } = await supabase
      .from("tracking_systems")
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("tracking_update", `Atualizou tracking: ${d.name ?? id}`);
  },

  deleteTrackingSystem: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase.from("tracking_systems").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("tracking_delete", `Excluiu tracking: ${name}`);
  },

  /* UTM Links */
  getUtmLinks: async (): Promise<UtmLink[]> => {
    const { data, error } = await supabase
      .from("utm_links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createUtmLink: async (d: {
    name?: string;
    description?: string;
    base_url: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
  }): Promise<UtmLink> => {
    const fullUrl = buildUtmUrl(d.base_url, d);
    const payload = {
      name: d.name ?? "",
      description: d.description ?? "",
      base_url: d.base_url,
      utm_source: d.utm_source,
      utm_medium: d.utm_medium,
      utm_campaign: d.utm_campaign,
      utm_content: d.utm_content ?? "",
      utm_term: d.utm_term ?? "",
      full_url: fullUrl,
    };
    const { data, error } = await supabase
      .from("utm_links")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("utm_create", `Gerou link UTM: ${d.utm_campaign || "sem nome"}`);
    return data;
  },

  deleteUtmLink: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase.from("utm_links").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("utm_delete", `Excluiu link UTM: ${name}`);
  },

  /* Bot Config (N8N) */
  getBotConfig: async (): Promise<BotConfig | null> => {
    try {
      const { data, error } = await supabase
        .from("bot_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) return null;
      if (!data) return null;
      return {
        ...data,
        initial_messages: Array.isArray(data.initial_messages) ? data.initial_messages : [],
      };
    } catch {
      return null;
    }
  },

  updateBotConfig: async (d: Partial<BotConfig>): Promise<BotConfig> => {
    const { data: existing } = await supabase.from("bot_config").select("id").limit(1).maybeSingle();
    if (!existing) throw new Error("Configuração do bot não encontrada");
    const payload: Record<string, unknown> = { ...d, updated_at: new Date().toISOString() };
    delete payload.id;
    delete payload.created_at;
    const { data, error } = await supabase
      .from("bot_config")
      .update(payload)
      .eq("id", (existing as { id: string }).id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("bot_config_update", "Atualizou configuração do bot N8N");
    return { ...data, initial_messages: Array.isArray(data?.initial_messages) ? data.initial_messages : [] };
  },

  /* Clients (CRM) */
  getClients: async (opts?: {
    limit?: number;
    offset?: number;
    search?: string;
    funnelStage?: string;
    creditStatus?: string;
    contractStatus?: string;
    personType?: string;
  }): Promise<{ rows: Client[]; total: number }> => {
    const { limit = 50, offset = 0, search, funnelStage, creditStatus, contractStatus, personType } = opts ?? {};

    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (funnelStage) query = query.eq("funnel_stage", funnelStage);
    if (creditStatus) query = query.eq("credit_status", creditStatus);
    if (contractStatus) query = query.eq("contract_status", contractStatus);
    if (personType) query = query.eq("person_type", personType);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%,cnpj.ilike.%${search}%,company_name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  },

  getClient: async (id: string): Promise<Client> => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  createClient: async (d: Partial<Client>): Promise<Client> => {
    const sanitized = sanitizeClientDates(d);
    const { data, error } = await supabase
      .from("clients")
      .insert(sanitized)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const visitorId = (d as Record<string, unknown>).visitor_id as string | undefined;
    if (visitorId && data?.id) {
      await supabase
        .from("client_tracking_events")
        .update({ client_id: data.id })
        .eq("visitor_id", visitorId)
        .is("client_id", null);
    }
    const label = d.person_type === "pj" ? (d.company_name || d.trade_name || "PJ") : (d.full_name || "PF");
    await auditLog("client_create", `Cadastrou cliente: ${label}`);
    return data;
  },

  updateClient: async (id: string, d: Partial<Client>): Promise<void> => {
    const sanitized = sanitizeClientDates({ ...d, updated_at: new Date().toISOString() });
    const { error } = await supabase
      .from("clients")
      .update(sanitized)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("client_update", `Atualizou cliente: ${d.full_name || d.company_name || id}`);
  },

  deleteClient: async (id: string, name: string): Promise<void> => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("client_delete", `Excluiu cliente: ${name}`);
  },

  /* Client Documents */
  getClientDocuments: async (clientId: string): Promise<ClientDocument[]> => {
    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createClientDocument: async (d: { client_id: string; doc_type: string; doc_name: string; file_url: string; page_count?: number }): Promise<ClientDocument> => {
    const { data, error } = await supabase
      .from("client_documents")
      .insert(d)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateClientDocument: async (id: string, d: Partial<ClientDocument>): Promise<void> => {
    const { error } = await supabase.from("client_documents").update(d).eq("id", id);
    if (error) throw new Error(error.message);
  },

  deleteClientDocument: async (id: string): Promise<void> => {
    const { data: doc } = await supabase.from("client_documents").select("file_url").eq("id", id).single();
    const { error } = await supabase.from("client_documents").delete().eq("id", id);
    if (error) throw new Error(error.message);
    if (doc?.file_url && !doc.file_url.startsWith("http")) {
      await supabase.storage.from("client-documents").remove([doc.file_url]);
    }
  },

  uploadClientDoc: async (clientId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${clientId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("client-documents")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return path;
  },

  getClientDocSignedUrl: async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60 * 60);
    if (error) throw new Error(error.message);
    return data?.signedUrl ?? "";
  },

  /* Client Tracking Events */
  getClientEvents: async (clientId: string, limit = 100): Promise<ClientTrackingEvent[]> => {
    const { data, error } = await supabase
      .from("client_tracking_events")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getVisitorEvents: async (visitorId: string, limit = 100): Promise<ClientTrackingEvent[]> => {
    const { data, error } = await supabase
      .from("client_tracking_events")
      .select("*")
      .eq("visitor_id", visitorId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  insertTrackingEvent: async (event: Partial<ClientTrackingEvent>): Promise<void> => {
    await supabaseIsolated.from("client_tracking_events").insert(event);
  },

  /** Visitantes únicos por página (Landing, Campanha, Cadastro) para o Dashboard */
  getPageVisitorStats: async (opts?: {
    dateFrom?: string;
    dateTo?: string;
    month?: number;
    year?: number;
  }): Promise<{
    landing: { month: number; today: number; online: number };
    campanha: { month: number; today: number; online: number };
    cadastro: { month: number; today: number; online: number };
  }> => {
    const now = new Date();
    const year = opts?.year ?? now.getFullYear();
    const month = opts?.month ?? now.getMonth();

    let dateFrom: string;
    let dateTo: string;
    if (opts?.dateFrom && opts?.dateTo) {
      dateFrom = opts.dateFrom;
      dateTo = opts.dateTo;
    } else {
      dateFrom = new Date(year, month, 1).toISOString();
      dateTo = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const countUnique = (rows: { visitor_id: string }[]) => {
      const ids = new Set((rows ?? []).map((r) => r.visitor_id).filter(Boolean));
      return ids.size;
    };

    const run = async (
      pageFilter: "landing" | "campanha" | "cadastro",
      from: string,
      to?: string
    ): Promise<number> => {
      let q = supabase
        .from("client_tracking_events")
        .select("visitor_id")
        .eq("event_type", "pageview")
        .gte("created_at", from);
      if (to) q = q.lte("created_at", to);
      if (pageFilter === "landing") {
        q = q.or("page_url.eq./,page_url.ilike./?%");
      } else if (pageFilter === "campanha") {
        q = q.ilike("page_url", "/campanha%");
      } else {
        q = q.ilike("page_url", "/cadastro%");
      }
      const { data } = await q;
      return countUnique(data ?? []);
    };

    const [landingMonth, landingToday, landingOnline, campanhaMonth, campanhaToday, campanhaOnline, cadastroMonth, cadastroToday, cadastroOnline] =
      await Promise.all([
        run("landing", dateFrom, dateTo),
        run("landing", todayStart, now.toISOString()),
        run("landing", fiveMinAgo),
        run("campanha", dateFrom, dateTo),
        run("campanha", todayStart, now.toISOString()),
        run("campanha", fiveMinAgo),
        run("cadastro", dateFrom, dateTo),
        run("cadastro", todayStart, now.toISOString()),
        run("cadastro", fiveMinAgo),
      ]);

    return {
      landing: { month: landingMonth, today: landingToday, online: landingOnline },
      campanha: { month: campanhaMonth, today: campanhaToday, online: campanhaOnline },
      cadastro: { month: cadastroMonth, today: cadastroToday, online: cadastroOnline },
    };
  },

  /** Comparativo: 2 meses ou 2 períodos */
  getPageVisitorStatsComparison: async (opts: {
    mode: "mes" | "periodo";
    periodA?: { month?: number; year?: number; dateFrom?: string; dateTo?: string };
    periodB?: { month?: number; year?: number; dateFrom?: string; dateTo?: string };
  }): Promise<{
    periodA: { label: string; landing: PageStats; campanha: PageStats; cadastro: PageStats };
    periodB: { label: string; landing: PageStats; campanha: PageStats; cadastro: PageStats };
    today: { landing: number; campanha: number; cadastro: number };
    online: { landing: number; campanha: number; cadastro: number };
  }> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const countUnique = (rows: { visitor_id: string }[]) => {
      const ids = new Set((rows ?? []).map((r) => r.visitor_id).filter(Boolean));
      return ids.size;
    };

    const run = async (
      pageFilter: "landing" | "campanha" | "cadastro",
      from: string,
      to?: string
    ): Promise<number> => {
      let q = supabase
        .from("client_tracking_events")
        .select("visitor_id")
        .eq("event_type", "pageview")
        .gte("created_at", from);
      if (to) q = q.lte("created_at", to);
      if (pageFilter === "landing") {
        q = q.or("page_url.eq./,page_url.ilike./?%");
      } else if (pageFilter === "campanha") {
        q = q.ilike("page_url", "/campanha%");
      } else {
        q = q.ilike("page_url", "/cadastro%");
      }
      const { data } = await q;
      return countUnique(data ?? []);
    };

    const getPeriodStats = async (
      p: { month?: number; year?: number; dateFrom?: string; dateTo?: string }
    ): Promise<{ dateFrom: string; dateTo: string }> => {
      if (opts.mode === "periodo" && p.dateFrom && p.dateTo) {
        return {
          dateFrom: new Date(p.dateFrom).toISOString(),
          dateTo: new Date(p.dateTo + "T23:59:59.999").toISOString(),
        };
      }
      const year = p.year ?? now.getFullYear();
      const month = p.month ?? now.getMonth();
      return {
        dateFrom: new Date(year, month, 1).toISOString(),
        dateTo: new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString(),
      };
    };

    const periodA = opts.periodA ?? { month: now.getMonth(), year: now.getFullYear() };
    const periodB = opts.periodB ?? { month: now.getMonth() - 1, year: now.getFullYear() };

    const [rangeA, rangeB] = await Promise.all([
      getPeriodStats(periodA),
      getPeriodStats(periodB),
    ]);

    const MESES: Record<number, string> = {
      0: "Janeiro", 1: "Fevereiro", 2: "Março", 3: "Abril", 4: "Maio", 5: "Junho",
      6: "Julho", 7: "Agosto", 8: "Setembro", 9: "Outubro", 10: "Novembro", 11: "Dezembro",
    };

    const nowIso = now.toISOString();
    const [
      landingA, campanhaA, cadastroA,
      landingB, campanhaB, cadastroB,
      landingToday, campanhaToday, cadastroToday,
      landingOnline, campanhaOnline, cadastroOnline,
    ] = await Promise.all([
      run("landing", rangeA.dateFrom, rangeA.dateTo),
      run("campanha", rangeA.dateFrom, rangeA.dateTo),
      run("cadastro", rangeA.dateFrom, rangeA.dateTo),
      run("landing", rangeB.dateFrom, rangeB.dateTo),
      run("campanha", rangeB.dateFrom, rangeB.dateTo),
      run("cadastro", rangeB.dateFrom, rangeB.dateTo),
      run("landing", todayStart, nowIso),
      run("campanha", todayStart, nowIso),
      run("cadastro", todayStart, nowIso),
      run("landing", fiveMinAgo, nowIso),
      run("campanha", fiveMinAgo, nowIso),
      run("cadastro", fiveMinAgo, nowIso),
    ]);

    const labelA =
      opts.mode === "periodo" && periodA.dateFrom && periodA.dateTo
        ? `${new Date(periodA.dateFrom).toLocaleDateString("pt-BR")} a ${new Date(periodA.dateTo).toLocaleDateString("pt-BR")}`
        : `${MESES[(periodA as { month?: number }).month ?? 0] ?? ""} ${(periodA as { year?: number }).year ?? ""}`;
    const labelB =
      opts.mode === "periodo" && periodB.dateFrom && periodB.dateTo
        ? `${new Date(periodB.dateFrom).toLocaleDateString("pt-BR")} a ${new Date(periodB.dateTo).toLocaleDateString("pt-BR")}`
        : `${MESES[(periodB as { month?: number }).month ?? 0] ?? ""} ${(periodB as { year?: number }).year ?? ""}`;

    return {
      periodA: {
        label: labelA,
        landing: { month: landingA, today: landingToday, online: landingOnline },
        campanha: { month: campanhaA, today: campanhaToday, online: campanhaOnline },
        cadastro: { month: cadastroA, today: cadastroToday, online: cadastroOnline },
      },
      periodB: {
        label: labelB,
        landing: { month: landingB, today: landingToday, online: landingOnline },
        campanha: { month: campanhaB, today: campanhaToday, online: campanhaOnline },
        cadastro: { month: cadastroB, today: cadastroToday, online: cadastroOnline },
      },
      today: { landing: landingToday, campanha: campanhaToday, cadastro: cadastroToday },
      online: { landing: landingOnline, campanha: campanhaOnline, cadastro: cadastroOnline },
    };
  },

  /* Car Prices (Importação de planilhas) */
  getCarPrices: async (opts?: { limit?: number; offset?: number }): Promise<{ rows: CarPrice[]; total: number }> => {
    const { limit = 100, offset = 0 } = opts ?? {};
    const { data, error, count } = await supabase
      .from("car_prices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  },

  insertCarPrices: async (rows: Omit<CarPrice, "id" | "created_at" | "updated_at">[]): Promise<number> => {
    if (rows.length === 0) return 0;
    const toNum = (v: string | number | null | undefined): number | null => {
      if (v == null || v === "") return null;
      if (typeof v === "number") return isNaN(v) ? null : v;
      const cleaned = String(v).replace(/[R$\s.]/g, "").replace(",", ".");
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };
    const toInt = (v: string | number | null | undefined): number | null => {
      const n = toNum(v);
      return n == null ? null : Math.floor(n);
    };
    const payload = rows.map((r) => ({
      ...r,
      prazo_contrato: toInt(r.prazo_contrato),
      franquia_km_mes: toInt(r.franquia_km_mes),
      valor_mensal_locacao: toNum(r.valor_mensal_locacao),
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from("car_prices").insert(payload).select("id");
    if (error) throw new Error(error.message);
    await auditLog("car_prices_import", `Importou ${data?.length ?? 0} preços de carros`);
    return data?.length ?? 0;
  },

  getCarPricesForSite: async (): Promise<CarPrice[]> => {
    const PAGE_SIZE = 1000;
    const all: CarPrice[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabaseIsolated
        .from("car_prices")
        .select("marca, nome_carro, modelo_carro, categoria, valor_mensal_locacao")
        .order("nome_carro")
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      const page = data ?? [];
      all.push(...page);
      hasMore = page.length === PAGE_SIZE;
      offset += PAGE_SIZE;
    }
    return all;
  },

  /** Retorna todas as variantes de car_prices para a calculadora (filtro por categoria, km, prazo) */
  getCarPricesFullForSite: async (): Promise<CarPrice[]> => {
    const PAGE_SIZE = 1000;
    const all: CarPrice[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabaseIsolated
        .from("car_prices")
        .select("marca, nome_carro, modelo_carro, categoria, prazo_contrato, franquia_km_mes, valor_mensal_locacao")
        .order("nome_carro")
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      const page = data ?? [];
      all.push(...page);
      hasMore = page.length === PAGE_SIZE;
      offset += PAGE_SIZE;
    }
    return all;
  },

  getCarBrandMappings: async (): Promise<Map<string, string>> => {
    const { data, error } = await supabase
      .from("car_brand_mappings")
      .select("nome_carro, marca");
    if (error) return new Map();
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set(row.nome_carro.toLowerCase().trim(), row.marca.trim());
    }
    return map;
  },

  saveCarBrandMapping: async (nomeCarro: string, marca: string): Promise<void> => {
    const key = nomeCarro.toLowerCase().trim();
    const { error } = await supabase
      .from("car_brand_mappings")
      .upsert({ nome_carro: key, marca: marca.trim() }, { onConflict: "nome_carro" });
    if (error) throw new Error(error.message);
    await auditLog("car_brand_learn", `Aprendeu marca: ${key} → ${marca.trim()}`);
  },

  deleteCarBrandMapping: async (nomeCarro: string): Promise<void> => {
    const key = nomeCarro.toLowerCase().trim();
    const { error } = await supabase
      .from("car_brand_mappings")
      .delete()
      .eq("nome_carro", key);
    if (error) throw new Error(error.message);
    await auditLog("car_brand_delete", `Excluiu marca: ${key}`);
  },

  getCarCategoryMappings: async (): Promise<Map<string, string>> => {
    const { data, error } = await supabase
      .from("car_category_mappings")
      .select("nome_carro, categoria");
    if (error) return new Map();
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set(row.nome_carro.toLowerCase().trim(), row.categoria.trim());
    }
    return map;
  },

  saveCarCategoryMapping: async (nomeCarro: string, categoria: string): Promise<void> => {
    const key = nomeCarro.toLowerCase().trim();
    const { error } = await supabase
      .from("car_category_mappings")
      .upsert({ nome_carro: key, categoria: categoria.trim() }, { onConflict: "nome_carro" });
    if (error) throw new Error(error.message);
    await auditLog("car_category_learn", `Aprendeu categoria: ${key} → ${categoria.trim()}`);
  },

  deleteCarCategoryMapping: async (nomeCarro: string): Promise<void> => {
    const key = nomeCarro.toLowerCase().trim();
    const { error } = await supabase
      .from("car_category_mappings")
      .delete()
      .eq("nome_carro", key);
    if (error) throw new Error(error.message);
    await auditLog("car_category_delete", `Excluiu categoria: ${key}`);
  },

  deleteCarPricesByCar: async (marca: string, nomeCarro: string): Promise<number> => {
    const { data, error } = await supabase
      .from("car_prices")
      .delete()
      .eq("marca", marca.trim())
      .eq("nome_carro", nomeCarro.trim())
      .select("id");
    if (error) throw new Error(error.message);
    const deleted = data?.length ?? 0;
    if (deleted > 0) {
      await auditLog("car_prices_delete_by_car", `Excluiu ${deleted} registro(s): ${marca} ${nomeCarro}`);
    }
    return deleted;
  },

  deleteAllCarPrices: async (): Promise<void> => {
    const { error } = await supabase.from("car_prices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    await auditLog("car_prices_delete_all", "Excluiu todos os preços importados");
  },

  /* Testimonials (Depoimentos) */
  getTestimonials: async (opts?: { clientId?: string }): Promise<Testimonial[]> => {
    let query = supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (opts?.clientId) query = query.eq("client_id", opts.clientId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getTestimonialsWithClients: async (): Promise<TestimonialWithClient[]> => {
    const { data, error } = await supabase
      .from("testimonials")
      .select(`
        *,
        client:clients(full_name, person_type, occupation, responsible_occupation, responsible_role, company_name, trade_name, responsible_name)
      `)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TestimonialWithClient[];
  },

  getTestimonialsPublic: async (): Promise<TestimonialWithClient[]> => {
    const { data, error } = await supabase
      .from("testimonials")
      .select(`
        *,
        client:clients(full_name, person_type, occupation, responsible_occupation, responsible_role, company_name, trade_name, responsible_name)
      `)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TestimonialWithClient[];
  },

  createTestimonial: async (d: { client_id: string; delivery_photo_url?: string; testimonial_text: string }): Promise<Testimonial> => {
    const { data, error } = await supabase
      .from("testimonials")
      .insert({ ...d, delivery_photo_url: d.delivery_photo_url ?? "" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditLog("testimonial_create", `Cadastrou depoimento do cliente ${d.client_id}`);
    return data;
  },

  updateTestimonial: async (id: string, d: Partial<{ delivery_photo_url: string; testimonial_text: string }>): Promise<void> => {
    const { error } = await supabase
      .from("testimonials")
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog("testimonial_update", `Atualizou depoimento ${id}`);
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    const { data: t } = await supabase.from("testimonials").select("delivery_photo_url").eq("id", id).single();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw new Error(error.message);
    if (t?.delivery_photo_url) {
      const parts = t.delivery_photo_url.split("/testimonial-images/");
      if (parts.length >= 2) await supabase.storage.from("testimonial-images").remove([parts[1]]);
    }
    await auditLog("testimonial_delete", `Excluiu depoimento ${id}`);
  },

  uploadTestimonialPhoto: async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("testimonial-images")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("testimonial-images").getPublicUrl(path);
    return data.publicUrl;
  },
};

/** API pública para cadastro de clientes (sem autenticação) - usa RPC para contornar RLS */
export const publicClientApi = {
  createClient: async (d: Partial<Client>): Promise<Client> => {
    const sanitized = sanitizeClientDates(d);
    const payload = { ...sanitized } as Record<string, unknown>;
    const { data, error } = await supabaseIsolated.rpc("create_client_public", {
      data: payload,
    });
    if (error) throw new Error(error.message);
    return data as Client;
  },

  createClientDocument: async (d: { client_id: string; doc_type: string; doc_name: string; file_url: string; page_count?: number }): Promise<ClientDocument> => {
    const { data, error } = await supabaseIsolated.rpc("create_client_document_public", {
      data: d,
    });
    if (error) throw new Error(error.message);
    return data as ClientDocument;
  },

  uploadClientDoc: async (clientId: string, file: File): Promise<string> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const fnUrl = `${supabaseUrl}/functions/v1/upload-client-doc`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    const res = await fetch(fnUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${anonKey}` },
      body: formData,
    });

    const data = (await res.json()) as { path?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Falha no upload");
    if (!data.path) throw new Error("Resposta inválida do servidor");
    return data.path;
  },
};
