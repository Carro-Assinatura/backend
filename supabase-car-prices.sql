-- ============================================================
-- CAR_PRICES - Preços de carros importados de planilhas Excel
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.car_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT DEFAULT '',
  nome_carro TEXT NOT NULL DEFAULT '',
  modelo_carro TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  prazo_contrato TEXT DEFAULT '',
  franquia_km_mes TEXT DEFAULT '',
  tipo_pintura TEXT DEFAULT '',
  troca_pneus TEXT DEFAULT '',
  manutencao TEXT DEFAULT '',
  seguro TEXT DEFAULT '',
  carro_reserva TEXT DEFAULT '',
  insulfilm TEXT DEFAULT '',
  valor_km_excedido TEXT DEFAULT '',
  valor_mensal_locacao TEXT DEFAULT '',
  source_sheet TEXT DEFAULT '',
  source_row INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.car_prices IS 'Preços de carros importados de planilhas Excel';
COMMENT ON COLUMN public.car_prices.marca IS 'Marca do veículo';
COMMENT ON COLUMN public.car_prices.nome_carro IS 'Nome completo do carro';
COMMENT ON COLUMN public.car_prices.modelo_carro IS 'Modelo do carro';
COMMENT ON COLUMN public.car_prices.categoria IS 'Categoria (ex: SUV Compacto, Sedã Compacto)';
COMMENT ON COLUMN public.car_prices.prazo_contrato IS 'Prazo do contrato (ex: 12, 24, 36 meses)';
COMMENT ON COLUMN public.car_prices.franquia_km_mes IS 'Franquia de km por mês';
COMMENT ON COLUMN public.car_prices.tipo_pintura IS 'Tipo de pintura';
COMMENT ON COLUMN public.car_prices.troca_pneus IS 'Troca do jogo de pneus';
COMMENT ON COLUMN public.car_prices.manutencao IS 'Manutenção';
COMMENT ON COLUMN public.car_prices.seguro IS 'Seguro';
COMMENT ON COLUMN public.car_prices.carro_reserva IS 'Carro reserva';
COMMENT ON COLUMN public.car_prices.insulfilm IS 'Insulfilm';
COMMENT ON COLUMN public.car_prices.valor_km_excedido IS 'Valor do km excedido';
COMMENT ON COLUMN public.car_prices.valor_mensal_locacao IS 'Valor mensal da locação';
COMMENT ON COLUMN public.car_prices.source_sheet IS 'Nome da aba de origem';
COMMENT ON COLUMN public.car_prices.source_row IS 'Número da linha de origem';

CREATE INDEX IF NOT EXISTS idx_car_prices_nome ON public.car_prices(LOWER(nome_carro));
CREATE INDEX IF NOT EXISTS idx_car_prices_marca ON public.car_prices(LOWER(marca));
CREATE INDEX IF NOT EXISTS idx_car_prices_created ON public.car_prices(created_at DESC);

ALTER TABLE public.car_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "car_prices_read" ON public.car_prices;
CREATE POLICY "car_prices_read" ON public.car_prices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "car_prices_write" ON public.car_prices;
CREATE POLICY "car_prices_write" ON public.car_prices
  FOR ALL USING (public.has_min_role('gerente'));
