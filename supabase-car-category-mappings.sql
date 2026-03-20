-- ============================================================
-- CAR_CATEGORY_MAPPINGS - Categorias aprendidas pelo usuário
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_category_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_carro TEXT NOT NULL UNIQUE,
  categoria TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.car_category_mappings IS 'Categorias aprendidas: nome_carro (lowercase) -> categoria';

ALTER TABLE public.car_category_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "car_category_mappings_read" ON public.car_category_mappings;
CREATE POLICY "car_category_mappings_read" ON public.car_category_mappings
  FOR SELECT USING (public.has_min_role('analista'));

DROP POLICY IF EXISTS "car_category_mappings_write" ON public.car_category_mappings;
CREATE POLICY "car_category_mappings_write" ON public.car_category_mappings
  FOR ALL USING (public.has_min_role('gerente'));
