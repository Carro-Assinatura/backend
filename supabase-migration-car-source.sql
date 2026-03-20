-- ============================================================
-- MIGRAÇÃO: Fonte de dados dos carros no site (Planilhas vs Importar)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Inserir setting car_source (planilhas | importar | vazio)
INSERT INTO public.settings (key, value, label, category) VALUES
  ('car_source', '', 'Fonte dos carros no site (interno)', 'geral')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, category = EXCLUDED.category;

-- Permitir leitura pública de car_source para o site exibir os carros corretos
DROP POLICY IF EXISTS "settings_public" ON public.settings;
DROP POLICY IF EXISTS "Settings publicas para todos" ON public.settings;
CREATE POLICY "settings_public" ON public.settings
  FOR SELECT USING (
    key IN ('whatsapp_number', 'whatsapp_message', 'site_title', 'site_description', 'car_source')
  );
