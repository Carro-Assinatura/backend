-- ============================================================
-- Tabelas para gestão de planilhas Google Sheets
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela principal de planilhas
CREATE TABLE IF NOT EXISTS public.spreadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  sheet_id TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Páginas/abas de cada planilha
CREATE TABLE IF NOT EXISTS public.spreadsheet_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id UUID NOT NULL REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  tab_name TEXT NOT NULL DEFAULT 'Página1',
  col_car_name TEXT NOT NULL DEFAULT 'Modelo-Versão',
  col_price TEXT NOT NULL DEFAULT 'Valor',
  col_category TEXT NOT NULL DEFAULT '',
  col_image TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ativar RLS
ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_pages ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas (caso existam)
DROP POLICY IF EXISTS "spreadsheets_select" ON public.spreadsheets;
DROP POLICY IF EXISTS "spreadsheets_insert" ON public.spreadsheets;
DROP POLICY IF EXISTS "spreadsheets_update" ON public.spreadsheets;
DROP POLICY IF EXISTS "spreadsheets_delete" ON public.spreadsheets;

DROP POLICY IF EXISTS "spreadsheet_pages_select" ON public.spreadsheet_pages;
DROP POLICY IF EXISTS "spreadsheet_pages_insert" ON public.spreadsheet_pages;
DROP POLICY IF EXISTS "spreadsheet_pages_update" ON public.spreadsheet_pages;
DROP POLICY IF EXISTS "spreadsheet_pages_delete" ON public.spreadsheet_pages;

-- 5. Policies - Leitura pública (o site precisa ler sem autenticação)
CREATE POLICY "spreadsheets_select" ON public.spreadsheets
  FOR SELECT USING (true);

CREATE POLICY "spreadsheet_pages_select" ON public.spreadsheet_pages
  FOR SELECT USING (true);

-- 6. Policies - Gerente ou superior pode gerenciar
CREATE POLICY "spreadsheets_insert" ON public.spreadsheets
  FOR INSERT WITH CHECK (public.has_min_role('gerente'));

CREATE POLICY "spreadsheets_update" ON public.spreadsheets
  FOR UPDATE USING (public.has_min_role('gerente'));

CREATE POLICY "spreadsheets_delete" ON public.spreadsheets
  FOR DELETE USING (public.has_min_role('gerente'));

CREATE POLICY "spreadsheet_pages_insert" ON public.spreadsheet_pages
  FOR INSERT WITH CHECK (public.has_min_role('gerente'));

CREATE POLICY "spreadsheet_pages_update" ON public.spreadsheet_pages
  FOR UPDATE USING (public.has_min_role('gerente'));

CREATE POLICY "spreadsheet_pages_delete" ON public.spreadsheet_pages
  FOR DELETE USING (public.has_min_role('gerente'));
