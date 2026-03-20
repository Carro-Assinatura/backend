-- Vincular dados de acesso (visitor_id) aos clientes cadastrados (lead ou comprador)
-- Execute no Supabase SQL Editor

-- 1) Adicionar visitor_id na tabela clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS visitor_id TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_clients_visitor ON public.clients(visitor_id) WHERE visitor_id != '';

COMMENT ON COLUMN public.clients.visitor_id IS 'ID do visitante (localStorage) para vincular eventos de tracking ao cliente';

-- 2) Atualizar create_client_public para aceitar visitor_id e vincular eventos
CREATE OR REPLACE FUNCTION public.create_client_public(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client public.clients%ROWTYPE;
  v_visitor_id TEXT;
BEGIN
  SET LOCAL row_security = off;

  v_visitor_id := NULLIF(TRIM(COALESCE((data->>'visitor_id')::text, '')), '');

  INSERT INTO public.clients (
    person_type, full_name, cpf, rg, birth_date, marital_status, occupation, monthly_income,
    company_name, trade_name, cnpj, state_registration, responsible_name, responsible_cpf,
    responsible_role, responsible_birth_date, responsible_marital_status, responsible_occupation,
    delivery_city, delivery_state, desired_color, email, phone, phone2,
    zip_code, street, street_number, complement, neighborhood, city, state,
    credit_status, credit_amount, credit_analysis_date, credit_notes,
    contract_start, contract_end, contract_status, contract_vehicle, contract_monthly,
    funnel_stage, purchase_proximity, utm_source, utm_medium, utm_campaign, referrer,
    notes, tags, is_partial, visitor_id
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
    COALESCE((data->>'is_partial')::boolean, true),
    COALESCE(v_visitor_id, '')
  )
  RETURNING * INTO new_client;

  -- Vincular eventos de tracking ao cliente (visitor_id -> client_id)
  IF v_visitor_id IS NOT NULL AND v_visitor_id != '' THEN
    UPDATE public.client_tracking_events
    SET client_id = new_client.id
    WHERE visitor_id = v_visitor_id AND client_id IS NULL;
  END IF;

  RETURN to_jsonb(new_client);
END;
$$;
