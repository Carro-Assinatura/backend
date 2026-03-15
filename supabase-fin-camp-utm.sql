-- ============================================================
-- FIN CAMP: Adiciona utm_content e utm_term para análise completa
-- Execute no Supabase SQL Editor (após supabase-marketing.sql)
-- ============================================================

-- Clients: adicionar utm_content e utm_term
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS utm_content TEXT DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS utm_term TEXT DEFAULT '';

-- client_tracking_events: adicionar utm_content e utm_term
ALTER TABLE public.client_tracking_events ADD COLUMN IF NOT EXISTS utm_content TEXT DEFAULT '';
ALTER TABLE public.client_tracking_events ADD COLUMN IF NOT EXISTS utm_term TEXT DEFAULT '';
