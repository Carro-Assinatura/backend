-- ============================================================
-- MIGRAÇÃO: Garantir leitura pública de car_source e car_prices
-- Execute no Supabase SQL Editor se os carros não aparecem no site
-- ============================================================

-- 1. Garantir que car_source seja legível por visitantes anônimos
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

-- 2. Garantir que car_prices seja legível por todos (site público)
DROP POLICY IF EXISTS "car_prices_read" ON public.car_prices;
CREATE POLICY "car_prices_read" ON public.car_prices
  FOR SELECT USING (true);
