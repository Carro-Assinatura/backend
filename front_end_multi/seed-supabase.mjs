/**
 * Script de seed para o Supabase.
 * Cria o usuário admin e popula as configurações iniciais.
 *
 * Pré-requisito: rodar o SQL do arquivo supabase-setup.sql no Supabase Dashboard > SQL Editor
 *
 * Uso: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node seed-supabase.mjs
 * Ou crie um .env na pasta front_end_multi com essas variáveis.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_KEY (variáveis de ambiente ou .env)");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function createAdminUser() {
  console.log("Criando usuário admin...");

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: "admin@multi.com.br",
      password: "admin123",
      email_confirm: true,
      user_metadata: { name: "Administrador", role: "admin" },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.msg?.includes("already been registered") || data.message?.includes("already been registered")) {
      console.log("Usuário admin já existe.");
      return;
    }
    console.error("Erro ao criar admin:", data);
    return;
  }

  console.log(`Admin criado: admin@multi.com.br / admin123 (ID: ${data.id})`);
}

async function seedSettings() {
  console.log("Verificando settings...");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key&limit=1`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json();
    if (err.code === "PGRST205") {
      console.error("Tabela 'settings' não encontrada. Rode o supabase-setup.sql primeiro!");
      return;
    }
    console.error("Erro ao verificar settings:", err);
    return;
  }

  const existing = await res.json();
  if (existing.length > 0) {
    console.log("Settings já existem. Pulando seed.");
    return;
  }

  const defaultSettings = [
    { key: "google_sheets_api_key", value: "", label: "Google Sheets API Key", category: "google_sheets" },
    { key: "google_sheets_id", value: "", label: "ID da Planilha", category: "google_sheets" },
    { key: "google_sheets_tab", value: "Página1", label: "Nome da Aba", category: "google_sheets" },
    { key: "column_car_name", value: "Modelo-Versão", label: "Coluna: Nome do Carro", category: "colunas" },
    { key: "column_category", value: "", label: "Coluna: Categoria", category: "colunas" },
    { key: "column_price", value: "Valor", label: "Coluna: Preço", category: "colunas" },
    { key: "column_image", value: "", label: "Coluna: Imagem", category: "colunas" },
    { key: "removebg_api_key", value: "", label: "API Key do Remove.bg", category: "imagens" },
    { key: "whatsapp_number", value: "5511999999999", label: "Número do WhatsApp", category: "contato" },
    { key: "whatsapp_message", value: "Olá! Gostaria de saber mais sobre carros por assinatura.", label: "Mensagem padrão do WhatsApp", category: "contato" },
    { key: "site_title", value: "Multi Experiências", label: "Título do Site", category: "geral" },
    { key: "site_description", value: "Carro por assinatura sem entrada e sem preocupação", label: "Descrição do Site", category: "geral" },
  ];

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify(defaultSettings),
  });

  if (insertRes.ok) {
    console.log(`${defaultSettings.length} configurações inseridas.`);
  } else {
    const err = await insertRes.json();
    console.error("Erro ao inserir settings:", err);
  }
}

async function main() {
  await createAdminUser();
  await seedSettings();
  console.log("\nSeed concluído!");
  console.log("Credenciais: admin@multi.com.br / admin123");
}

main().catch(console.error);
