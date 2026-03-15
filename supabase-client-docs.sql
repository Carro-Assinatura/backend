-- ============================================================
-- CLIENTES: Novos campos e tipos de documentos
-- Execute no Supabase SQL Editor (após supabase-marketing.sql)
-- ============================================================

-- Novos campos para PJ (Canal Indireto)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_city TEXT DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS delivery_state TEXT DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS desired_color TEXT DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS responsible_birth_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS responsible_marital_status TEXT DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS responsible_occupation TEXT DEFAULT '';

-- client_documents: adicionar page_count para controle de 30 páginas
ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 1;

COMMENT ON COLUMN public.clients.delivery_city IS 'Cidade para entrega do carro (PJ)';
COMMENT ON COLUMN public.clients.delivery_state IS 'Estado para entrega do carro (PJ)';
COMMENT ON COLUMN public.clients.desired_color IS 'Cor desejada do veículo';
COMMENT ON COLUMN public.client_documents.page_count IS 'Número de páginas do documento (limite 30 total)';
