-- ============================================================
-- USER ROLES - Níveis de acesso e permissões configuráveis
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Tabela user_roles (níveis de acesso)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'Níveis de acesso (Administrador, Gerente, etc)';
COMMENT ON COLUMN public.user_roles.is_system IS 'true = admin, não pode editar/excluir';

-- 2. Tabela role_permissions (permissões por nível)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL REFERENCES public.user_roles(key) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(role_key, permission_key)
);

COMMENT ON TABLE public.role_permissions IS 'Permissões granulares por nível de acesso';

-- 3. Remover CHECK de profiles.role para permitir roles dinâmicos
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Seed: níveis padrão
INSERT INTO public.user_roles (key, label, is_system, sort_order) VALUES
  ('admin', 'Administrador', true, 100),
  ('gerente', 'Gerente', false, 80),
  ('marketing', 'Marketing', false, 60),
  ('analista', 'Analista', false, 40)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- 5. Seed: permissões padrão (admin tem todas; outros configuráveis)
-- Lista de permissões do sistema
-- menu_dashboard, menu_fin_camp, menu_planilhas, menu_tracking, menu_bot_config,
-- menu_clients, menu_testimonials, menu_settings, menu_users, menu_logs,
-- perm_config_geral, perm_config_logo, perm_usuarios_criar, perm_usuarios_editar, perm_usuarios_excluir

INSERT INTO public.role_permissions (role_key, permission_key, granted) VALUES
  ('gerente', 'menu_dashboard', true),
  ('gerente', 'menu_fin_camp', true),
  ('gerente', 'menu_planilhas', true),
  ('gerente', 'menu_tracking', true),
  ('gerente', 'menu_bot_config', true),
  ('gerente', 'menu_clients', true),
  ('gerente', 'menu_testimonials', true),
  ('gerente', 'menu_settings', true),
  ('gerente', 'menu_users', false),
  ('gerente', 'menu_logs', false),
  ('marketing', 'menu_dashboard', true),
  ('marketing', 'menu_fin_camp', true),
  ('marketing', 'menu_planilhas', false),
  ('marketing', 'menu_tracking', true),
  ('marketing', 'menu_bot_config', false),
  ('marketing', 'menu_clients', true),
  ('marketing', 'menu_testimonials', true),
  ('marketing', 'menu_settings', false),
  ('marketing', 'menu_users', false),
  ('marketing', 'menu_logs', false),
  ('analista', 'menu_dashboard', true),
  ('analista', 'menu_fin_camp', true),
  ('analista', 'menu_planilhas', false),
  ('analista', 'menu_tracking', false),
  ('analista', 'menu_bot_config', false),
  ('analista', 'menu_clients', true),
  ('analista', 'menu_testimonials', false),
  ('analista', 'menu_settings', false),
  ('analista', 'menu_users', false),
  ('analista', 'menu_logs', false),
  ('gerente', 'perm_config_geral', true),
  ('gerente', 'perm_config_logo', true),
  ('gerente', 'perm_config_categorias', false),
  ('gerente', 'perm_usuarios_criar', true),
  ('gerente', 'perm_usuarios_editar', true),
  ('gerente', 'perm_usuarios_excluir', false),
  ('gerente', 'perm_planilhas_importar', true),
  ('gerente', 'perm_planilhas_excluir', true),
  ('gerente', 'perm_clientes_criar', true),
  ('gerente', 'perm_clientes_editar', true),
  ('gerente', 'perm_clientes_excluir', true),
  ('marketing', 'perm_config_geral', false),
  ('marketing', 'perm_config_logo', false),
  ('marketing', 'perm_config_categorias', false),
  ('marketing', 'perm_usuarios_criar', false),
  ('marketing', 'perm_usuarios_editar', false),
  ('marketing', 'perm_usuarios_excluir', false),
  ('marketing', 'perm_planilhas_importar', false),
  ('marketing', 'perm_planilhas_excluir', false),
  ('marketing', 'perm_clientes_criar', true),
  ('marketing', 'perm_clientes_editar', true),
  ('marketing', 'perm_clientes_excluir', false),
  ('analista', 'perm_config_geral', false),
  ('analista', 'perm_config_logo', false),
  ('analista', 'perm_config_categorias', false),
  ('analista', 'perm_usuarios_criar', false),
  ('analista', 'perm_usuarios_editar', false),
  ('analista', 'perm_usuarios_excluir', false),
  ('analista', 'perm_planilhas_importar', false),
  ('analista', 'perm_planilhas_excluir', false),
  ('analista', 'perm_clientes_criar', true),
  ('analista', 'perm_clientes_editar', true),
  ('analista', 'perm_clientes_excluir', false)
ON CONFLICT (role_key, permission_key) DO UPDATE SET granted = EXCLUDED.granted;

-- Nota: admin não precisa de role_permissions - tem acesso total por is_system

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_admin" ON public.user_roles;
CREATE POLICY "user_roles_admin" ON public.user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "user_roles_read" ON public.user_roles;
CREATE POLICY "user_roles_read" ON public.user_roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "role_permissions_admin" ON public.role_permissions;
CREATE POLICY "role_permissions_admin" ON public.role_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "role_permissions_read" ON public.role_permissions;
CREATE POLICY "role_permissions_read" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);
