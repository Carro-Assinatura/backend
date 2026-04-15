-- ============================================================
-- Promoções por linha de car_prices (preço especial + período)
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_price_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_price_id UUID NOT NULL REFERENCES public.car_prices(id) ON DELETE CASCADE,
  promo_valor_mensal_locacao NUMERIC(12, 2) NOT NULL CHECK (promo_valor_mensal_locacao >= 0),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT car_price_promotions_date_range CHECK (ends_on >= starts_on),
  CONSTRAINT car_price_promotions_one_per_car UNIQUE (car_price_id)
);

CREATE INDEX IF NOT EXISTS idx_car_price_promotions_dates ON public.car_price_promotions (starts_on, ends_on);

COMMENT ON TABLE public.car_price_promotions IS 'Preço promocional temporário por registro de car_prices';
COMMENT ON COLUMN public.car_price_promotions.starts_on IS 'Primeiro dia da promoção (America/Sao_Paulo)';
COMMENT ON COLUMN public.car_price_promotions.ends_on IS 'Último dia da promoção (America/Sao_Paulo)';

ALTER TABLE public.car_price_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "car_price_promotions_select" ON public.car_price_promotions;
CREATE POLICY "car_price_promotions_select" ON public.car_price_promotions
  FOR SELECT USING (
    (timezone('America/Sao_Paulo', now()))::date BETWEEN starts_on AND ends_on
    OR public.has_min_role('gerente')
  );

DROP POLICY IF EXISTS "car_price_promotions_insert" ON public.car_price_promotions;
CREATE POLICY "car_price_promotions_insert" ON public.car_price_promotions
  FOR INSERT WITH CHECK (public.has_min_role('gerente'));

DROP POLICY IF EXISTS "car_price_promotions_update" ON public.car_price_promotions;
CREATE POLICY "car_price_promotions_update" ON public.car_price_promotions
  FOR UPDATE USING (public.has_min_role('gerente'))
  WITH CHECK (public.has_min_role('gerente'));

DROP POLICY IF EXISTS "car_price_promotions_delete" ON public.car_price_promotions;
CREATE POLICY "car_price_promotions_delete" ON public.car_price_promotions
  FOR DELETE USING (public.has_min_role('gerente'));
