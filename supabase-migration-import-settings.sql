-- MIGRAÇÃO: Configurações de importação de planilhas
-- Execute no Supabase SQL Editor

INSERT INTO public.settings (key, value, label, category) VALUES
  ('import_duplicate_preference', 'maior', 'Preferência de preço em duplicados (maior ou menor)', 'importacao'),
  ('import_filter_fields', 'marca,nome_carro,modelo_carro,franquia_km_mes,prazo_contrato', 'Campos exibidos no filtro de carros', 'importacao'),
  ('import_duplicate_fields', 'nome_carro,franquia_km_mes,prazo_contrato', 'Campos para comparativo de igualdade (duplicidade)', 'importacao')
ON CONFLICT (key) DO NOTHING;
