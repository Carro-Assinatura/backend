-- ============================================================
-- UTM LINKS: Tabela para armazenar links gerados com parâmetros UTM
-- Execute no Supabase SQL Editor (após supabase-marketing.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.utm_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',

  -- URL base (sem parâmetros)
  base_url TEXT NOT NULL,

  -- Parâmetros UTM
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT DEFAULT '',
  utm_term TEXT DEFAULT '',

  -- URL completa gerada (para consulta rápida)
  full_url TEXT NOT NULL,

  -- Metadados
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.utm_links IS 'Links gerados com parâmetros UTM para campanhas de marketing';

CREATE INDEX IF NOT EXISTS idx_utm_links_created ON public.utm_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_utm_links_campaign ON public.utm_links(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_utm_links_source ON public.utm_links(utm_source);

-- RLS
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utm_links_select" ON public.utm_links
  FOR SELECT USING (public.has_min_role('marketing'));

CREATE POLICY "utm_links_insert" ON public.utm_links
  FOR INSERT WITH CHECK (public.has_min_role('marketing'));

CREATE POLICY "utm_links_update" ON public.utm_links
  FOR UPDATE USING (public.has_min_role('marketing'));

CREATE POLICY "utm_links_delete" ON public.utm_links
  FOR DELETE USING (public.has_min_role('marketing'));
