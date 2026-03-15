-- ============================================================
-- MARKETING: Tracking Systems + CRM (Clientes)
-- Execute no Supabase SQL Editor
-- ============================================================

-- =====================
-- 1) TRACKING SYSTEMS
-- =====================
CREATE TABLE IF NOT EXISTS public.tracking_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'gtm', 'google_analytics', 'clarity', 'mixpanel',
    'hubspot', 'bigquery', 'metabase'
  )),
  active BOOLEAN DEFAULT true,
  credentials JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.tracking_systems IS 'Sistemas de tracking e analytics configurados';
COMMENT ON COLUMN public.tracking_systems.credentials IS '
GTM:              { "container_id": "GTM-XXXXXXX", "environment_auth": "", "environment_preview": "" }
Google Analytics: { "measurement_id": "G-XXXXXXXXXX", "api_secret": "", "stream_id": "" }
Microsoft Clarity:{ "project_id": "XXXXXXXXXX" }
Mixpanel:         { "project_token": "", "api_key": "", "api_secret": "" }
HubSpot:          { "portal_id": "", "tracking_code": "", "access_token": "" }
Google BigQuery:  { "project_id": "", "dataset_id": "", "service_account_json": "" }
Metabase:         { "instance_url": "", "username": "", "api_key": "" }
';

ALTER TABLE public.tracking_systems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_systems_read" ON public.tracking_systems;
CREATE POLICY "tracking_systems_read" ON public.tracking_systems
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tracking_systems_write" ON public.tracking_systems;
CREATE POLICY "tracking_systems_write" ON public.tracking_systems
  FOR ALL USING (public.has_min_role('gerente'));

-- =====================
-- 2) CLIENTES (CRM)
-- =====================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tipo
  person_type TEXT NOT NULL DEFAULT 'pf' CHECK (person_type IN ('pf', 'pj')),

  -- Pessoa Física
  full_name TEXT NOT NULL DEFAULT '',
  cpf TEXT DEFAULT '',
  rg TEXT DEFAULT '',
  birth_date DATE,
  marital_status TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  monthly_income NUMERIC(12,2) DEFAULT 0,

  -- Pessoa Jurídica
  company_name TEXT DEFAULT '',
  trade_name TEXT DEFAULT '',
  cnpj TEXT DEFAULT '',
  state_registration TEXT DEFAULT '',
  responsible_name TEXT DEFAULT '',
  responsible_cpf TEXT DEFAULT '',
  responsible_role TEXT DEFAULT '',

  -- Contato
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  phone2 TEXT DEFAULT '',

  -- Endereço
  zip_code TEXT DEFAULT '',
  street TEXT DEFAULT '',
  street_number TEXT DEFAULT '',
  complement TEXT DEFAULT '',
  neighborhood TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',

  -- Crédito
  credit_status TEXT DEFAULT 'pendente' CHECK (credit_status IN (
    'pendente', 'em_analise', 'aprovado', 'reprovado'
  )),
  credit_amount NUMERIC(12,2) DEFAULT 0,
  credit_analysis_date TIMESTAMPTZ,
  credit_notes TEXT DEFAULT '',

  -- Contrato
  contract_start DATE,
  contract_end DATE,
  contract_status TEXT DEFAULT 'sem_contrato' CHECK (contract_status IN (
    'sem_contrato', 'ativo', 'renovacao_pendente', 'cancelado', 'encerrado'
  )),
  contract_vehicle TEXT DEFAULT '',
  contract_monthly NUMERIC(12,2) DEFAULT 0,

  -- Funil de vendas
  funnel_stage TEXT DEFAULT 'visitante' CHECK (funnel_stage IN (
    'visitante', 'lead', 'qualificado', 'proposta', 'negociacao', 'fechamento', 'cliente'
  )),
  purchase_proximity INTEGER DEFAULT 0 CHECK (purchase_proximity BETWEEN 0 AND 100),

  -- UTM / Origem
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  referrer TEXT DEFAULT '',

  -- Meta
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_partial BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.clients IS 'Cadastro completo de clientes (PF e PJ) com crédito, contrato e funil';

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_read" ON public.clients;
CREATE POLICY "clients_read" ON public.clients
  FOR SELECT USING (public.has_min_role('analista'));

DROP POLICY IF EXISTS "clients_write" ON public.clients;
CREATE POLICY "clients_write" ON public.clients
  FOR ALL USING (public.has_min_role('gerente'));

-- =====================
-- 3) DOCUMENTOS DO CLIENTE
-- =====================
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT '',
  doc_name TEXT NOT NULL DEFAULT '',
  file_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.client_documents IS 'Documentos enviados pelo cliente para análise de crédito';

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_documents_read" ON public.client_documents;
CREATE POLICY "client_documents_read" ON public.client_documents
  FOR SELECT USING (public.has_min_role('analista'));

DROP POLICY IF EXISTS "client_documents_write" ON public.client_documents;
CREATE POLICY "client_documents_write" ON public.client_documents
  FOR ALL USING (public.has_min_role('gerente'));

-- =====================
-- 4) EVENTOS DE TRACKING DO CLIENTE
-- =====================
CREATE TABLE IF NOT EXISTS public.client_tracking_events (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'pageview',
  page_url TEXT DEFAULT '',
  page_title TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  device TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  screen_resolution TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.client_tracking_events IS 'Eventos de navegação e interação do visitante/cliente no site';

CREATE INDEX IF NOT EXISTS idx_tracking_visitor ON public.client_tracking_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tracking_client ON public.client_tracking_events(client_id);
CREATE INDEX IF NOT EXISTS idx_tracking_created ON public.client_tracking_events(created_at DESC);

ALTER TABLE public.client_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_events_insert" ON public.client_tracking_events;
CREATE POLICY "tracking_events_insert" ON public.client_tracking_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tracking_events_read" ON public.client_tracking_events;
CREATE POLICY "tracking_events_read" ON public.client_tracking_events
  FOR SELECT USING (public.has_min_role('analista'));

-- =====================
-- 5) STORAGE BUCKET PARA DOCUMENTOS
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "client_docs_read" ON storage.objects;
CREATE POLICY "client_docs_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "client_docs_upload" ON storage.objects;
CREATE POLICY "client_docs_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "client_docs_delete" ON storage.objects;
CREATE POLICY "client_docs_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');
