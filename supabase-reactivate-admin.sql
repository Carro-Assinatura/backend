-- ============================================================
-- Reativar admin@multi.com.br (acesso à intranet no localhost)
-- Execute no Supabase Dashboard > SQL Editor > Run
-- ============================================================
--
-- Na app, "Desativar" usuário só coloca profiles.active = false.
-- Este script reativa o perfil e remove banimento no Auth (se houver).

-- 1) Perfil: ativo + admin + email alinhado ao Auth
UPDATE public.profiles p
SET
  active = true,
  role = 'admin',
  email = COALESCE(NULLIF(TRIM(p.email), ''), u.email::text),
  updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('admin@multi.com.br');

-- 2) Auth: confirmar e-mail (se ainda não) e remover banimento
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  banned_until = NULL
WHERE lower(email) = lower('admin@multi.com.br');

-- Verificação (opcional): deve mostrar active = true
-- SELECT p.id, p.email, p.role, p.active, u.email AS auth_email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE lower(u.email) = lower('admin@multi.com.br');
