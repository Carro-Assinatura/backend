-- ============================================================
-- CAR_BRAND_MAPPINGS - Marcas aprendidas pelo usuário
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_brand_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_carro TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.car_brand_mappings IS 'Marcas aprendidas: nome_carro (lowercase) -> marca';

ALTER TABLE public.car_brand_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "car_brand_mappings_read" ON public.car_brand_mappings;
CREATE POLICY "car_brand_mappings_read" ON public.car_brand_mappings
  FOR SELECT USING (public.has_min_role('analista'));

DROP POLICY IF EXISTS "car_brand_mappings_write" ON public.car_brand_mappings;
CREATE POLICY "car_brand_mappings_write" ON public.car_brand_mappings
  FOR ALL USING (public.has_min_role('gerente'));
