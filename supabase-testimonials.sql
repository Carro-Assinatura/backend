-- ============================================================
-- DEPOIMENTOS (Testimonials)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela de depoimentos
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  delivery_photo_url TEXT DEFAULT '',
  testimonial_text TEXT NOT NULL DEFAULT '' CHECK (char_length(testimonial_text) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.testimonials IS 'Depoimentos de clientes exibidos no site';
COMMENT ON COLUMN public.testimonials.delivery_photo_url IS 'Foto da entrega do carro (URL do storage)';
COMMENT ON COLUMN public.testimonials.testimonial_text IS 'Texto do depoimento (máx 1000 caracteres)';

CREATE INDEX IF NOT EXISTS idx_testimonials_client ON public.testimonials(client_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_created ON public.testimonials(created_at DESC);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_read" ON public.testimonials;
CREATE POLICY "testimonials_read" ON public.testimonials
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "testimonials_write" ON public.testimonials;
CREATE POLICY "testimonials_write" ON public.testimonials
  FOR ALL USING (public.has_min_role('marketing'));

-- Bucket para fotos de entrega
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-images', 'testimonial-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "testimonial_images_read" ON storage.objects;
CREATE POLICY "testimonial_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'testimonial-images');

DROP POLICY IF EXISTS "testimonial_images_upload" ON storage.objects;
CREATE POLICY "testimonial_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'testimonial-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "testimonial_images_delete" ON storage.objects;
CREATE POLICY "testimonial_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'testimonial-images' AND auth.role() = 'authenticated');
