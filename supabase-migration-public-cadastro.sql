-- Permite cadastro público de clientes (formulário do site)
-- Execute no Supabase SQL Editor
--
-- Usa funções SECURITY DEFINER + row_security off para contornar RLS no INSERT público.

-- ========== FUNÇÃO: Cadastro público de cliente ==========
CREATE OR REPLACE FUNCTION public.create_client_public(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client public.clients%ROWTYPE;
BEGIN
  SET LOCAL row_security = off;
  INSERT INTO public.clients (
    person_type, full_name, cpf, rg, birth_date, marital_status, occupation, monthly_income,
    company_name, trade_name, cnpj, state_registration, responsible_name, responsible_cpf,
    responsible_role, responsible_birth_date, responsible_marital_status, responsible_occupation,
    delivery_city, delivery_state, desired_color, email, phone, phone2,
    zip_code, street, street_number, complement, neighborhood, city, state,
    credit_status, credit_amount, credit_analysis_date, credit_notes,
    contract_start, contract_end, contract_status, contract_vehicle, contract_monthly,
    funnel_stage, purchase_proximity, utm_source, utm_medium, utm_campaign, referrer,
    notes, tags, is_partial
  ) VALUES (
    COALESCE((data->>'person_type')::text, 'pf'),
    COALESCE((data->>'full_name')::text, ''),
    COALESCE((data->>'cpf')::text, ''),
    COALESCE((data->>'rg')::text, ''),
    NULLIF(TRIM(data->>'birth_date'), '')::date,
    COALESCE((data->>'marital_status')::text, ''),
    COALESCE((data->>'occupation')::text, ''),
    COALESCE((data->>'monthly_income')::numeric, 0),
    COALESCE((data->>'company_name')::text, ''),
    COALESCE((data->>'trade_name')::text, ''),
    COALESCE((data->>'cnpj')::text, ''),
    COALESCE((data->>'state_registration')::text, ''),
    COALESCE((data->>'responsible_name')::text, ''),
    COALESCE((data->>'responsible_cpf')::text, ''),
    COALESCE((data->>'responsible_role')::text, ''),
    NULLIF(TRIM(data->>'responsible_birth_date'), '')::date,
    COALESCE((data->>'responsible_marital_status')::text, ''),
    COALESCE((data->>'responsible_occupation')::text, ''),
    COALESCE((data->>'delivery_city')::text, ''),
    COALESCE((data->>'delivery_state')::text, ''),
    COALESCE((data->>'desired_color')::text, ''),
    COALESCE((data->>'email')::text, ''),
    COALESCE((data->>'phone')::text, ''),
    COALESCE((data->>'phone2')::text, ''),
    COALESCE((data->>'zip_code')::text, ''),
    COALESCE((data->>'street')::text, ''),
    COALESCE((data->>'street_number')::text, ''),
    COALESCE((data->>'complement')::text, ''),
    COALESCE((data->>'neighborhood')::text, ''),
    COALESCE((data->>'city')::text, ''),
    COALESCE((data->>'state')::text, ''),
    COALESCE((data->>'credit_status')::text, 'pendente'),
    COALESCE((data->>'credit_amount')::numeric, 0),
    NULLIF(TRIM(data->>'credit_analysis_date'), '')::timestamptz,
    COALESCE((data->>'credit_notes')::text, ''),
    NULLIF(TRIM(data->>'contract_start'), '')::date,
    NULLIF(TRIM(data->>'contract_end'), '')::date,
    COALESCE((data->>'contract_status')::text, 'sem_contrato'),
    COALESCE((data->>'contract_vehicle')::text, ''),
    COALESCE((data->>'contract_monthly')::numeric, 0),
    COALESCE((data->>'funnel_stage')::text, 'visitante'),
    COALESCE((data->>'purchase_proximity')::integer, 0),
    COALESCE((data->>'utm_source')::text, ''),
    COALESCE((data->>'utm_medium')::text, ''),
    COALESCE((data->>'utm_campaign')::text, ''),
    COALESCE((data->>'referrer')::text, ''),
    COALESCE((data->>'notes')::text, ''),
    COALESCE(
      CASE WHEN data ? 'tags' AND jsonb_typeof(data->'tags') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(data->'tags'))
        ELSE ARRAY[]::text[] END,
      ARRAY[]::text[]
    ),
    COALESCE((data->>'is_partial')::boolean, true)
  )
  RETURNING * INTO new_client;

  RETURN to_jsonb(new_client);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_client_public(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_client_public(jsonb) TO authenticated;

-- ========== FUNÇÃO: Inserir documento do cliente ==========
CREATE OR REPLACE FUNCTION public.create_client_document_public(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_doc public.client_documents%ROWTYPE;
BEGIN
  SET LOCAL row_security = off;
  INSERT INTO public.client_documents (
    client_id, doc_type, doc_name, file_url, page_count, status, notes
  ) VALUES (
    (data->>'client_id')::uuid,
    COALESCE((data->>'doc_type')::text, ''),
    COALESCE((data->>'doc_name')::text, ''),
    COALESCE((data->>'file_url')::text, ''),
    COALESCE((data->>'page_count')::integer, 1),
    COALESCE((data->>'status')::text, 'pendente'),
    COALESCE((data->>'notes')::text, '')
  )
  RETURNING * INTO new_doc;

  RETURN to_jsonb(new_doc);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_client_document_public(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_client_document_public(jsonb) TO authenticated;

-- ========== STORAGE: Upload de documentos (anon + authenticated) ==========
-- Remove política restritiva e cria uma que permite anon e authenticated
DROP POLICY IF EXISTS "client_docs_upload" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_upload_anon" ON storage.objects;
CREATE POLICY "client_docs_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'client-documents');

-- Se o bucket client-documents não existir, crie pelo Dashboard:
-- Storage > New bucket > id: client-documents
