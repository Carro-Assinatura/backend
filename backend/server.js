import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import db from "./database.js";
import { generateToken, authenticate, requireRole, requireMinLevel } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================================
// AUTH
// ============================================================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }

  const token = generateToken(user);

  db.prepare("INSERT INTO audit_log (user_id, action) VALUES (?, ?)").run(user.id, "login");

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(user);
});

app.put("/api/auth/password", authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Senhas são obrigatórias" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: "Senha atual incorreta" });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, req.user.id);

  res.json({ message: "Senha alterada com sucesso" });
});

// ============================================================
// SETTINGS (admin e gerente)
// ============================================================

app.get("/api/settings", authenticate, requireMinLevel("gerente"), (_req, res) => {
  const settings = db.prepare("SELECT key, value, label, category, updated_at FROM settings ORDER BY category, label").all();
  res.json(settings);
});

app.get("/api/settings/public", (_req, res) => {
  const keys = ["whatsapp_number", "whatsapp_message", "site_title", "site_description"];
  const placeholders = keys.map(() => "?").join(",");
  const settings = db.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).all(...keys);
  const result = {};
  for (const s of settings) result[s.key] = s.value;
  res.json(result);
});

app.put("/api/settings", authenticate, requireRole("admin"), (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  const update = db.prepare(
    "UPDATE settings SET value = ?, updated_by = ?, updated_at = datetime('now') WHERE key = ?",
  );

  const transaction = db.transaction((items) => {
    for (const { key, value } of items) {
      update.run(value, req.user.id, key);
    }
  });

  transaction(settings);

  db.prepare("INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)").run(
    req.user.id,
    "settings_update",
    JSON.stringify(settings.map((s) => s.key)),
  );

  res.json({ message: "Configurações salvas" });
});

// ============================================================
// USERS (admin)
// ============================================================

app.get("/api/users", authenticate, requireRole("admin"), (_req, res) => {
  const users = db.prepare("SELECT id, name, email, role, active, created_at FROM users ORDER BY name").all();
  res.json(users);
});

app.post("/api/users", authenticate, requireRole("admin"), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const validRoles = ["admin", "gerente", "marketing", "analista"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Nível de acesso inválido" });
  }

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) {
    return res.status(409).json({ error: "Email já cadastrado" });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashed, role);

  db.prepare("INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)").run(
    req.user.id, "user_create", `Criou usuário ${email} (${role})`,
  );

  res.status(201).json({ id: result.lastInsertRowid, name, email, role });
});

app.put("/api/users/:id", authenticate, requireRole("admin"), (req, res) => {
  const { name, email, role, active } = req.body;
  const userId = parseInt(req.params.id);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  db.prepare(
    "UPDATE users SET name = ?, email = ?, role = ?, active = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(
    name ?? user.name,
    email ?? user.email,
    role ?? user.role,
    active ?? user.active,
    userId,
  );

  res.json({ message: "Usuário atualizado" });
});

app.put("/api/users/:id/reset-password", authenticate, requireRole("admin"), (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: "Nova senha é obrigatória" });

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, parseInt(req.params.id));

  res.json({ message: "Senha resetada" });
});

app.delete("/api/users/:id", authenticate, requireRole("admin"), (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: "Você não pode excluir a si mesmo" });
  }

  db.prepare("UPDATE users SET active = 0, updated_at = datetime('now') WHERE id = ?").run(userId);
  res.json({ message: "Usuário desativado" });
});

// ============================================================
// AUDIT LOG (admin)
// ============================================================

app.get("/api/audit", authenticate, requireRole("admin"), (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = db.prepare(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
  res.json(logs);
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
