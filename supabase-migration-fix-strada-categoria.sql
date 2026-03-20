-- Corrige categoria: Strada e Rampage → Picapes Compactas
-- Execute no Supabase SQL Editor
--
-- 1) car_prices = dados exibidos no site (obrigatório)
-- 2) car_category_mappings = usado na próxima importação

-- 1. Atualiza os preços já importados (o que o site exibe)
UPDATE public.car_prices
SET categoria = 'Picapes Compactas'
WHERE LOWER(TRIM(nome_carro)) LIKE '%strada%'
   OR LOWER(TRIM(nome_carro)) LIKE '%rampage%';

-- 2. Atualiza os mapeamentos para futuras importações
UPDATE public.car_category_mappings
SET categoria = 'Picapes Compactas'
WHERE LOWER(TRIM(nome_carro)) LIKE '%strada%'
   OR LOWER(TRIM(nome_carro)) LIKE '%rampage%';

-- Se não existir mapeamento, insere
INSERT INTO public.car_category_mappings (nome_carro, categoria)
SELECT 'strada', 'Picapes Compactas'
WHERE NOT EXISTS (SELECT 1 FROM public.car_category_mappings WHERE LOWER(TRIM(nome_carro)) = 'strada');

INSERT INTO public.car_category_mappings (nome_carro, categoria)
SELECT 'rampage', 'Picapes Compactas'
WHERE NOT EXISTS (SELECT 1 FROM public.car_category_mappings WHERE LOWER(TRIM(nome_carro)) = 'rampage');
