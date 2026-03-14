-- ============================================================
-- Tabela e Storage para fotos de carros
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela de imagens de carros
CREATE TABLE IF NOT EXISTS public.car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS car_images_name_lower
  ON public.car_images (LOWER(car_name));

-- 2. RLS
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "car_images_select" ON public.car_images
  FOR SELECT USING (true);

CREATE POLICY "car_images_insert" ON public.car_images
  FOR INSERT WITH CHECK (public.has_min_role('gerente'));

CREATE POLICY "car_images_update" ON public.car_images
  FOR UPDATE USING (public.has_min_role('gerente'));

CREATE POLICY "car_images_delete" ON public.car_images
  FOR DELETE USING (public.has_min_role('gerente'));

-- 3. Bucket de storage para as fotos (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Policies de storage
CREATE POLICY "car_img_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

CREATE POLICY "car_img_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "car_img_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');

CREATE POLICY "car_img_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');
