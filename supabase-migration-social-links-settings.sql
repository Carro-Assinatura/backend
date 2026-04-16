-- ============================================================
-- MIGRAÇÃO: URLs de redes sociais (rodapé do site)
-- Execute no Supabase SQL Editor.
-- Valor vazio = ícone não aparece no site público.
-- ============================================================

INSERT INTO public.settings (key, value, label, category) VALUES
  ('social_instagram_url', '', 'Instagram — URL do perfil', 'redes_sociais'),
  ('social_facebook_url', '', 'Facebook — URL da página', 'redes_sociais'),
  ('social_linkedin_url', '', 'LinkedIn — URL do perfil ou empresa', 'redes_sociais'),
  ('social_x_url', '', 'X (Twitter) — URL do perfil', 'redes_sociais'),
  ('social_youtube_url', '', 'YouTube — URL do canal', 'redes_sociais'),
  ('social_tiktok_url', '', 'TikTok — URL do perfil', 'redes_sociais'),
  ('social_threads_url', '', 'Threads — URL do perfil', 'redes_sociais'),
  ('social_pinterest_url', '', 'Pinterest — URL do perfil', 'redes_sociais'),
  ('social_snapchat_url', '', 'Snapchat — URL do perfil ou add', 'redes_sociais')
ON CONFLICT (key) DO NOTHING;

-- Leitura anônima para o rodapé (mesmas chaves já públicas + car_source + redes)
DROP POLICY IF EXISTS "settings_public" ON public.settings;
CREATE POLICY "settings_public" ON public.settings
  FOR SELECT USING (
    key IN (
      'whatsapp_number',
      'whatsapp_message',
      'site_title',
      'site_description',
      'car_source',
      'social_instagram_url',
      'social_facebook_url',
      'social_linkedin_url',
      'social_x_url',
      'social_youtube_url',
      'social_tiktok_url',
      'social_threads_url',
      'social_pinterest_url',
      'social_snapchat_url'
    )
  );
