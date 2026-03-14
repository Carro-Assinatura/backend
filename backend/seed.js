import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "./database.js";

const adminPassword = bcrypt.hashSync("admin123", 10);

const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@multi.com.br");

if (!existingAdmin) {
  db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
  ).run("Administrador", "admin@multi.com.br", adminPassword, "admin");
  console.log("Usuário admin criado: admin@multi.com.br / admin123");
} else {
  console.log("Usuário admin já existe.");
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

const upsert = db.prepare(`
  INSERT INTO settings (key, value, label, category)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET label = excluded.label, category = excluded.category
`);

for (const s of defaultSettings) {
  upsert.run(s.key, s.value, s.label, s.category);
}

console.log(`${defaultSettings.length} configurações criadas/atualizadas.`);
console.log("Seed concluído!");
