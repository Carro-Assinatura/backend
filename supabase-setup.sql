-- ============================================================
-- MULTI EXPERIÊNCIAS - Setup Supabase
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela profiles (complementa auth.users com role e nome)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'analista' CHECK (role IN ('admin','gerente','marketing','analista')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela settings (configurações do sistema)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'geral',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela audit_log (log de atividades)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: criar profile automaticamente quando user se cadastra
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'analista')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver todos os profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Admins podem editar profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Usuario pode editar proprio profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes e admins podem ler settings" ON public.settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

CREATE POLICY "Admins podem editar settings" ON public.settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Settings publicas para todos" ON public.settings
  FOR SELECT USING (
    key IN ('whatsapp_number', 'whatsapp_message', 'site_title', 'site_description')
  );

-- Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver audit_log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Usuarios autenticados podem inserir audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SEED: Configurações padrão
-- ============================================================
INSERT INTO public.settings (key, value, label, category) VALUES
  ('google_sheets_api_key', '', 'Google Sheets API Key', 'google_sheets'),
  ('google_sheets_id', '', 'ID da Planilha', 'google_sheets'),
  ('google_sheets_tab', 'Página1', 'Nome da Aba', 'google_sheets'),
  ('column_car_name', 'Modelo-Versão', 'Coluna: Nome do Carro', 'colunas'),
  ('column_category', '', 'Coluna: Categoria', 'colunas'),
  ('column_price', 'Valor', 'Coluna: Preço', 'colunas'),
  ('column_image', '', 'Coluna: Imagem', 'colunas'),
  ('removebg_api_key', '', 'API Key do Remove.bg', 'imagens'),
  ('whatsapp_number', '5511999999999', 'Número do WhatsApp', 'contato'),
  ('whatsapp_message', 'Olá! Gostaria de saber mais sobre carros por assinatura.', 'Mensagem padrão do WhatsApp', 'contato'),
  ('site_title', 'Multi Experiências', 'Título do Site', 'geral'),
  ('site_description', 'Carro por assinatura sem entrada e sem preocupação', 'Descrição do Site', 'geral')
ON CONFLICT (key) DO NOTHING;
