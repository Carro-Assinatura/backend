-- ============================================================
-- MIGRAÇÃO: Colunas numéricas em car_prices
-- Altera franquia_km_mes, prazo_contrato e valor_mensal_locacao de TEXT para número
-- (Se você tiver valor_contrato em vez de valor_mensal_locacao, ajuste o script)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Função auxiliar para converter texto BR (1.500,00) ou simples (1500) para numeric
CREATE OR REPLACE FUNCTION public.parse_numeric_from_text(t TEXT)
RETURNS NUMERIC AS $$
BEGIN
  IF t IS NULL OR trim(t) = '' THEN RETURN NULL; END IF;
  RETURN (regexp_replace(regexp_replace(trim(t), '\.', '', 'g'), ',', '.', 'g'))::numeric;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função auxiliar para converter texto para integer (ignora valores inválidos)
CREATE OR REPLACE FUNCTION public.parse_int_from_text(t TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF t IS NULL OR trim(t) = '' THEN RETURN NULL; END IF;
  RETURN trim(t)::integer;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Remover DEFAULT antes de alterar tipo (DEFAULT '' não pode ser convertido para integer/numeric)
ALTER TABLE public.car_prices ALTER COLUMN franquia_km_mes DROP DEFAULT;
ALTER TABLE public.car_prices ALTER COLUMN prazo_contrato DROP DEFAULT;
ALTER TABLE public.car_prices ALTER COLUMN valor_mensal_locacao DROP DEFAULT;

-- franquia_km_mes: TEXT -> INTEGER (ex: 1500, 3000)
ALTER TABLE public.car_prices
  ALTER COLUMN franquia_km_mes TYPE INTEGER
  USING (public.parse_int_from_text(franquia_km_mes));

-- prazo_contrato: TEXT -> INTEGER (ex: 12, 24, 36 meses)
ALTER TABLE public.car_prices
  ALTER COLUMN prazo_contrato TYPE INTEGER
  USING (public.parse_int_from_text(prazo_contrato));

-- valor_mensal_locacao: TEXT -> NUMERIC (valor monetário)
-- Suporta formato BR (1.500,00) e simples (1500)
ALTER TABLE public.car_prices
  ALTER COLUMN valor_mensal_locacao TYPE NUMERIC(12, 2)
  USING (public.parse_numeric_from_text(valor_mensal_locacao));

-- Se a coluna valor_contrato existir em sua tabela, descomente:
-- ALTER TABLE public.car_prices ALTER COLUMN valor_contrato DROP DEFAULT;
-- ALTER TABLE public.car_prices ALTER COLUMN valor_contrato TYPE NUMERIC(12, 2)
--   USING (public.parse_numeric_from_text(valor_contrato));

-- Opcional: definir DEFAULT NULL para novas linhas
ALTER TABLE public.car_prices ALTER COLUMN franquia_km_mes SET DEFAULT NULL;
ALTER TABLE public.car_prices ALTER COLUMN prazo_contrato SET DEFAULT NULL;
ALTER TABLE public.car_prices ALTER COLUMN valor_mensal_locacao SET DEFAULT NULL;

COMMENT ON COLUMN public.car_prices.franquia_km_mes IS 'Franquia de km por mês (número inteiro)';
COMMENT ON COLUMN public.car_prices.prazo_contrato IS 'Prazo do contrato em meses (número inteiro)';
COMMENT ON COLUMN public.car_prices.valor_mensal_locacao IS 'Valor mensal da locação (numérico)';
