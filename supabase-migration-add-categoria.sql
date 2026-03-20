-- ============================================================
-- MIGRAÇÃO: Adicionar coluna categoria em car_prices (tabela existente)
-- Execute no Supabase SQL Editor
-- ============================================================

ALTER TABLE public.car_prices ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT '';

COMMENT ON COLUMN public.car_prices.categoria IS 'Categoria (ex: SUV Compacto, Sedã Compacto)';
