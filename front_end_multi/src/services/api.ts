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
};
