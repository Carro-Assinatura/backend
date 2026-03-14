-- ============================================================
-- FIX: Corrigir recursão infinita nas policies RLS
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Criar funções auxiliares SECURITY DEFINER (ignoram RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_min_role(min_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT CASE role
      WHEN 'admin' THEN 4
      WHEN 'gerente' THEN 3
      WHEN 'marketing' THEN 2
      WHEN 'analista' THEN 1
      ELSE 0
    END FROM public.profiles WHERE id = auth.uid()) >= 
    (CASE min_role
      WHEN 'admin' THEN 4
      WHEN 'gerente' THEN 3
      WHEN 'marketing' THEN 2
      WHEN 'analista' THEN 1
      ELSE 0
    END),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Remover policies antigas com recursão
DROP POLICY IF EXISTS "Usuarios podem ver todos os profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem editar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuario pode editar proprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Gerentes e admins podem ler settings" ON public.settings;
DROP POLICY IF EXISTS "Admins podem editar settings" ON public.settings;
DROP POLICY IF EXISTS "Settings publicas para todos" ON public.settings;
DROP POLICY IF EXISTS "Admins podem ver audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir audit_log" ON public.audit_log;

-- 3. Recriar policies usando as funções (sem recursão)

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SETTINGS
CREATE POLICY "settings_read" ON public.settings
  FOR SELECT USING (public.has_min_role('gerente'));

CREATE POLICY "settings_public" ON public.settings
  FOR SELECT USING (
    key IN ('whatsapp_number', 'whatsapp_message', 'site_title', 'site_description')
  );

CREATE POLICY "settings_admin_write" ON public.settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "settings_admin_insert" ON public.settings
  FOR INSERT WITH CHECK (public.is_admin());

-- AUDIT LOG
CREATE POLICY "audit_admin_read" ON public.audit_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_insert" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
