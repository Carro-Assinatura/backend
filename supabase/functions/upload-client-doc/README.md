# Edge Function: upload-client-doc

Faz o upload de documentos de clientes usando a **service role**, contornando o RLS do Storage.

## Deploy (Supabase CLI)

1. Instale o Supabase CLI: https://supabase.com/docs/guides/cli
2. Faça login: `supabase login`
3. Vincule o projeto: `supabase link --project-ref SEU_PROJECT_ID`
   - O Project ID está em: Dashboard → Settings → General
4. Deploy:
```bash
cd /caminho/do/projeto
supabase functions deploy upload-client-doc
```

## Variáveis
A função usa automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do projeto.

## Uso
O frontend chama a função via `fetch` com FormData contendo `file` e `client_id`.
