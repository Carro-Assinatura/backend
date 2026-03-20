# Documentação da API — Integração N8N

Documentação completa para que o N8N possa **inserir e consultar** qualquer informação do site e banco de dados Supabase.

---

## 1. Visão Geral

| Componente | Tecnologia | Descrição |
|------------|------------|-----------|
| **Frontend** | React + Vite | Site em `front_end_multi/` |
| **Banco de Dados** | **Supabase (PostgreSQL)** | Acesso via REST API do Supabase |
| **Autenticação** | **Supabase Auth** | Email/senha + tabela `profiles` |
| **Storage** | Supabase Storage | Buckets para imagens e documentos |

**Não há API REST intermediária.** O N8N deve usar diretamente a **Supabase REST API** ou o nó **Supabase** do N8N.

---

## 2. Configuração Base

### Variáveis de ambiente (para N8N)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `SUPABASE_URL` | URL do projeto | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Chave anônima (pública) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (bypassa RLS) | Supabase Dashboard → Settings → API |

### Headers obrigatórios para REST API

```
apikey: <SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY ou JWT do usuário>
Content-Type: application/json
```

Para operações que exigem autenticação de usuário, use o **JWT** retornado pelo login. Para operações públicas ou com Service Role, use a **anon key** ou **service role key**.

---

## 3. Autenticação

### 3.1 Login (obter JWT)

**Endpoint:** `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`

**Headers:**
```
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:** O `access_token` no JSON de resposta é o JWT a ser usado em `Authorization: Bearer <access_token>`.

### 3.2 Roles (permissões)

| Role | Nível | Acesso |
|------|-------|--------|
| `admin` | 4 | Tudo (settings, audit, users, etc.) |
| `gerente` | 3 | Clientes, documentos, planilhas, tracking, bot, car images |
| `marketing` | 2 | UTM links, tracking systems |
| `analista` | 1 | Leitura de clientes e eventos |

O RLS (Row Level Security) do Supabase aplica essas regras automaticamente.

### 3.3 Bypass RLS (Service Role)

Para o N8N acessar **qualquer tabela** sem restrições de role, use a **Service Role Key** em vez da Anon Key. **Atenção:** não exponha essa chave no frontend.

---

## 4. Tabelas do Banco de Dados

### 4.1 `profiles`

Usuários do sistema (complementa `auth.users`).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK, referência auth.users |
| name | TEXT | Nome |
| email | TEXT | Email |
| role | TEXT | admin, gerente, marketing, analista |
| active | BOOLEAN | Ativo |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** SELECT público; INSERT/UPDATE/DELETE apenas admin.

---

### 4.2 `settings`

Configurações do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| key | TEXT | PK |
| value | TEXT | Valor |
| label | TEXT | Rótulo |
| category | TEXT | Categoria |
| updated_by | UUID | Quem atualizou |
| updated_at | TIMESTAMPTZ | |

**Chaves públicas (leitura sem auth):** `whatsapp_number`, `whatsapp_message`, `site_title`, `site_description`

---

### 4.3 `audit_log`

Log de atividades.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | BIGSERIAL | PK |
| user_id | UUID | Usuário |
| action | TEXT | Ação (ex: client_create) |
| details | TEXT | Detalhes |
| created_at | TIMESTAMPTZ | |

**RLS:** Leitura apenas admin; INSERT para usuários autenticados.

---

### 4.4 `clients`

CRM — cadastro de clientes (PF e PJ).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| person_type | TEXT | 'pf' ou 'pj' |
| full_name | TEXT | Nome completo (PF) |
| cpf | TEXT | CPF |
| rg | TEXT | RG |
| birth_date | DATE | Data nascimento |
| marital_status | TEXT | Estado civil |
| occupation | TEXT | Profissão |
| monthly_income | NUMERIC | Renda mensal |
| company_name | TEXT | Razão social (PJ) |
| trade_name | TEXT | Nome fantasia (PJ) |
| cnpj | TEXT | CNPJ |
| state_registration | TEXT | Inscrição estadual |
| responsible_name | TEXT | Signatário (PJ) |
| responsible_cpf | TEXT | CPF signatário |
| responsible_role | TEXT | Cargo |
| responsible_birth_date | DATE | Nascimento signatário |
| responsible_marital_status | TEXT | Estado civil signatário |
| responsible_occupation | TEXT | Profissão signatário |
| delivery_city | TEXT | Cidade entrega (PJ) |
| delivery_state | TEXT | Estado entrega (PJ) |
| desired_color | TEXT | Cor desejada |
| email | TEXT | Email |
| phone | TEXT | Telefone |
| phone2 | TEXT | Telefone 2 |
| zip_code | TEXT | CEP |
| street | TEXT | Rua |
| street_number | TEXT | Número |
| complement | TEXT | Complemento |
| neighborhood | TEXT | Bairro |
| city | TEXT | Cidade |
| state | TEXT | Estado |
| credit_status | TEXT | pendente, em_analise, aprovado, reprovado |
| credit_amount | NUMERIC | Valor aprovado |
| credit_analysis_date | TIMESTAMPTZ | Data análise |
| credit_notes | TEXT | Observações crédito |
| contract_start | DATE | Início contrato |
| contract_end | DATE | Fim contrato |
| contract_status | TEXT | sem_contrato, ativo, renovacao_pendente, cancelado, encerrado |
| contract_vehicle | TEXT | Veículo |
| contract_monthly | NUMERIC | Mensalidade |
| funnel_stage | TEXT | visitante, lead, qualificado, proposta, negociacao, fechamento, cliente |
| purchase_proximity | INTEGER | 0-100 |
| utm_source | TEXT | |
| utm_medium | TEXT | |
| utm_campaign | TEXT | |
| referrer | TEXT | |
| notes | TEXT | Observações |
| tags | TEXT[] | Tags |
| is_partial | BOOLEAN | Cadastro parcial |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Campos de data:** Enviar `null` para vazio (não enviar `""`).

**RLS:** Leitura analista+; escrita gerente+.

---

### 4.5 `client_documents`

Documentos enviados pelo cliente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| client_id | UUID | FK clients |
| doc_type | TEXT | cnh, comprovante_endereco, comprovante_renda (PF); contrato_social, dre_balanco, rr_simples_irpj (PJ) |
| doc_name | TEXT | Nome do arquivo |
| file_url | TEXT | Caminho no storage ou URL |
| page_count | INTEGER | Páginas (limite 30 total) |
| status | TEXT | pendente, aprovado, reprovado |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

**RLS:** Leitura analista+; escrita gerente+.

---

### 4.5b `testimonials`

Depoimentos de clientes exibidos no site.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| client_id | UUID | FK clients |
| delivery_photo_url | TEXT | Foto da entrega do carro (URL do storage) |
| testimonial_text | TEXT | Texto do depoimento (máx 1000 caracteres) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Storage:** Bucket `testimonial-images` (público para leitura).

**RLS:** SELECT público; escrita marketing+.

---

### 4.6 `client_tracking_events`

Eventos de navegação (pageview, etc.).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | BIGSERIAL | PK |
| client_id | UUID | Cliente (opcional) |
| visitor_id | TEXT | ID do visitante |
| event_type | TEXT | pageview, page_duration, etc. |
| page_url | TEXT | URL da página |
| page_title | TEXT | Título |
| referrer | TEXT | |
| utm_source | TEXT | |
| utm_medium | TEXT | |
| utm_campaign | TEXT | |
| device | TEXT | |
| browser | TEXT | |
| os | TEXT | |
| screen_resolution | TEXT | |
| ip_address | TEXT | |
| session_id | TEXT | |
| duration_seconds | INTEGER | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

**RLS:** **INSERT público** (sem auth); SELECT analista+.

---

### 4.7 `bot_config`

Configuração do chatbot N8N (singleton).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| active | BOOLEAN | Bot ativo |
| webhook_url | TEXT | URL do webhook N8N |
| initial_messages | JSONB | Array de mensagens iniciais |
| show_welcome_screen | BOOLEAN | |
| i18n_title | TEXT | |
| i18n_subtitle | TEXT | |
| i18n_input_placeholder | TEXT | |
| i18n_get_started | TEXT | |
| mode | TEXT | window, fullscreen |
| enable_streaming | BOOLEAN | |
| theme_primary_color | TEXT | Hex (#25D366) |
| load_previous_session | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** SELECT público; escrita gerente+.

---

### 4.8 `utm_links`

Links UTM gerados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | |
| description | TEXT | |
| base_url | TEXT | URL base |
| utm_source | TEXT | |
| utm_medium | TEXT | |
| utm_campaign | TEXT | |
| utm_content | TEXT | |
| utm_term | TEXT | |
| full_url | TEXT | URL completa gerada |
| created_by | UUID | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Marketing+.

---

### 4.9 `tracking_systems`

Sistemas de analytics (GTM, GA, Clarity, etc.).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | |
| type | TEXT | gtm, google_analytics, clarity, mixpanel, hubspot, bigquery, metabase |
| active | BOOLEAN | |
| credentials | JSONB | Credenciais por tipo |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** SELECT público; escrita gerente+.

---

### 4.10 `spreadsheets`

Planilhas Google Sheets.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| name | TEXT | |
| api_key | TEXT | |
| sheet_id | TEXT | ID da planilha |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** SELECT público; escrita gerente+.

---

### 4.11 `spreadsheet_pages`

Abas das planilhas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| spreadsheet_id | UUID | FK spreadsheets |
| tab_name | TEXT | Nome da aba |
| col_car_name | TEXT | Coluna nome carro |
| col_price | TEXT | Coluna preço |
| col_category | TEXT | Coluna categoria |
| col_image | TEXT | Coluna imagem |
| active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

**RLS:** SELECT público; escrita gerente+.

---

### 4.11b `car_prices`

Preços de carros importados de planilhas Excel.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| marca | TEXT | Marca |
| nome_carro | TEXT | Nome do carro |
| modelo_carro | TEXT | Modelo |
| prazo_contrato | TEXT | Prazo (ex: 12, 24 meses) |
| franquia_km_mes | TEXT | Franquia km/mês |
| tipo_pintura | TEXT | Tipo de pintura |
| troca_pneus | TEXT | Troca de pneus |
| manutencao | TEXT | Manutenção |
| seguro | TEXT | Seguro |
| carro_reserva | TEXT | Carro reserva |
| insulfilm | TEXT | Insulfilm |
| valor_km_excedido | TEXT | Valor km excedido |
| valor_mensal_locacao | TEXT | Valor mensal |
| source_sheet | TEXT | Aba de origem |
| source_row | INTEGER | Linha de origem |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Leitura analista+; escrita gerente+.

---

### 4.11c `car_brand_mappings`

Marcas aprendidas pelo usuário (nome do carro → marca).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| nome_carro | TEXT | Nome do carro (lowercase, único) |
| marca | TEXT | Marca aprendida |
| created_at | TIMESTAMPTZ | |

**RLS:** Leitura analista+; escrita gerente+.

---

### 4.12 `car_images`

Imagens de carros.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| car_name | TEXT | Nome do carro |
| image_url | TEXT | URL da imagem |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** SELECT público; escrita gerente+.

---

## 5. Operações REST (Supabase)

Base URL: `{SUPABASE_URL}/rest/v1`

### 5.1 Consultar (GET)

```
GET {SUPABASE_URL}/rest/v1/{tabela}?select=*
```

**Filtros (query params):**
- `id=eq.{uuid}` — igual
- `email=ilike.*@gmail.com` — contém (case insensitive)
- `created_at=gte.2025-01-01` — maior ou igual
- `created_at=lte.2025-12-31T23:59:59` — menor ou igual
- `funnel_stage=in.(lead,qualificado)` — em lista
- `or=(full_name.ilike.%joão%,email.ilike.%joão%)` — OU

**Ordenação:**
- `order=created_at.desc`

**Paginação:**
- `limit=50&offset=0`
- Ou `range=0,49` (inclusive)

**Exemplo — Listar clientes leads:**
```
GET {SUPABASE_URL}/rest/v1/clients?select=id,full_name,email,phone,funnel_stage,utm_source&funnel_stage=eq.lead&order=created_at.desc&limit=100
```

---

### 5.2 Inserir (POST)

```
POST {SUPABASE_URL}/rest/v1/{tabela}
```

**Headers:**
```
apikey: <KEY>
Authorization: Bearer <KEY ou JWT>
Content-Type: application/json
Prefer: return=representation
```

**Body:** Objeto JSON com os campos.

**Exemplo — Criar cliente:**
```json
POST {SUPABASE_URL}/rest/v1/clients

{
  "person_type": "pf",
  "full_name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "funnel_stage": "lead",
  "utm_source": "n8n",
  "utm_medium": "automation",
  "utm_campaign": "integracao"
}
```

**Exemplo — Inserir evento de tracking (sem auth):**
```json
POST {SUPABASE_URL}/rest/v1/client_tracking_events

{
  "visitor_id": "vis_abc123",
  "event_type": "pageview",
  "page_url": "https://site.com/modelos",
  "page_title": "Modelos",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "carros",
  "device": "desktop",
  "session_id": "sess_xyz"
}
```

---

### 5.3 Atualizar (PATCH)

```
PATCH {SUPABASE_URL}/rest/v1/{tabela}?id=eq.{uuid}
```

**Body:** Apenas os campos a alterar.

**Exemplo — Atualizar status do cliente:**
```json
PATCH {SUPABASE_URL}/rest/v1/clients?id=eq.550e8400-e29b-41d4-a716-446655440000

{
  "funnel_stage": "qualificado",
  "credit_status": "em_analise"
}
```

---

### 5.4 Excluir (DELETE)

```
DELETE {SUPABASE_URL}/rest/v1/{tabela}?id=eq.{uuid}
```

---

## 6. Storage (Supabase)

### Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `car-images` | Sim | Fotos de carros |
| `client-documents` | Não | Documentos de clientes (auth) |

### Upload de arquivo

```
POST {SUPABASE_URL}/storage/v1/object/client-documents/{client_id}/{nome_arquivo}
```

**Headers:**
```
apikey: <KEY>
Authorization: Bearer <JWT>
Content-Type: application/octet-stream
```

**Body:** Binário do arquivo.

O caminho retornado deve ser salvo em `client_documents.file_url`.

---

## 7. Exemplos N8N

### 7.1 Nó Supabase — Ler bot_config (anon key)

- **Operation:** Get Many
- **Table:** bot_config
- **Return All:** true
- **Credentials:** Supabase (URL + Anon Key)

### 7.2 Nó Supabase — Inserir cliente

- **Operation:** Insert
- **Table:** clients
- **Columns:** Mapear campos do JSON
- **Credentials:** Supabase com JWT ou Service Role

### 7.3 Nó HTTP Request — Login + Criar cliente

**Passo 1 — Login:**
- Method: POST
- URL: `{{$env.SUPABASE_URL}}/auth/v1/token?grant_type=password`
- Headers: `apikey: {{$env.SUPABASE_ANON_KEY}}`, `Content-Type: application/json`
- Body: `{"email":"admin@site.com","password":"senha"}`

**Passo 2 — Criar cliente (usar access_token do passo 1):**
- Method: POST
- URL: `{{$env.SUPABASE_URL}}/rest/v1/clients`
- Headers: `apikey`, `Authorization: Bearer {{$json.access_token}}`, `Content-Type: application/json`, `Prefer: return=representation`
- Body: JSON do cliente

### 7.4 Nó HTTP Request — Inserir evento (sem auth)

- Method: POST
- URL: `{{$env.SUPABASE_URL}}/rest/v1/client_tracking_events`
- Headers: `apikey`, `Authorization: Bearer {{$env.SUPABASE_ANON_KEY}}`, `Content-Type: application/json`
- Body: JSON do evento

### 7.5 Consultar clientes com filtros

```
GET {{$env.SUPABASE_URL}}/rest/v1/clients?select=id,full_name,email,phone,funnel_stage,utm_source,utm_medium,utm_campaign,created_at&funnel_stage=eq.lead&utm_source=eq.n8n&order=created_at.desc&limit=50
```

### 7.6 Atualizar funnel_stage de um cliente

```
PATCH {{$env.SUPABASE_URL}}/rest/v1/clients?id=eq.{{$json.client_id}}

{"funnel_stage": "proposta", "credit_status": "aprovado"}
```

### 7.7 Chat Trigger (N8N)

O nó **Chat Trigger** gera uma URL de webhook. Configure essa URL em `bot_config.webhook_url` na intranet (Conf Bot). O frontend envia mensagens do chat para essa URL.

O chat do site permite **upload de arquivos** (PNG, JPEG, JPG, PDF) para documentos de cadastro. Os arquivos chegam no workflow em formato binário.

### 7.7.1 Receber e salvar arquivos do chat no Supabase

Quando o usuário envia um arquivo pelo chat, o payload contém:

- `chatInput` — mensagem de texto (pode indicar o tipo de documento: "comprovante de endereço", "CNH", etc.)
- `files` — array com metadados de cada arquivo
- Dados binários — na aba **Binary** do nó, acesse por `binaryKey` de cada arquivo

**Tipos de documento (`client_documents.doc_type`):**

| PF (pessoa física) | PJ (pessoa jurídica) |
|--------------------|---------------------|
| cnh | contrato_social |
| comprovante_endereco | dre_balanco |
| comprovante_renda | rr_simples_irpj |

**Fluxo no N8N para salvar documento:**

1. **Chat Trigger** recebe mensagem + arquivos
2. **IF** — verificar se há arquivos (`$binary` não vazio)
3. **Obter client_id** — do contexto da conversa (metadata, sessão ou criar cliente antes)
4. **HTTP Request** — Upload para Supabase Storage:
   - Method: POST
   - URL: `{{$env.SUPABASE_URL}}/storage/v1/object/client-documents/{{$json.client_id}}/{{$json.fileName}}`
   - Headers: `apikey`, `Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`, `Content-Type: application/octet-stream`
   - Body: Binary Data (selecionar o arquivo da aba Binary)
5. **HTTP Request** — Inserir em `client_documents`:
   - Method: POST
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/client_documents`
   - Headers: `apikey`, `Authorization`, `Content-Type: application/json`, `Prefer: return=representation`
   - Body: `{"client_id":"...","doc_type":"comprovante_endereco","doc_name":"...","file_url":"client_id/nome_arquivo.pdf","page_count":1}`

**Mapear doc_type pela mensagem:** Use o `chatInput` para inferir o tipo (ex.: "comprovante de endereço" → comprovante_endereco). O AI Agent pode extrair isso antes de chamar um tool/subworkflow que faz o upload.

### 7.8 Erro: "No response received. Streaming enabled in trigger but disabled in agent"

**Causa:** O streaming está ativado no site (Bot Config → Streaming de respostas) ou no Chat Trigger, mas o nó **AI Agent** no workflow N8N não tem streaming habilitado.

**Soluções (escolha uma):**

1. **Desativar streaming no site** (mais simples):  
   Intranet → Configuração do Bot → desative "Streaming de respostas" e salve.

2. **Ativar streaming no N8N** (para respostas em tempo real):  
   - No nó **Chat Trigger**: em Options, defina Response Mode como "Streaming".  
   - No nó **AI Agent**: ative a opção de streaming nas configurações do nó.  
   Os dois precisam estar com streaming habilitado.

### 7.9 Erro: "Workflow was started" ou bot não responde (só mostra a mensagem do usuário)

**Causa:** O workflow não está retornando a resposta do AI Agent para o chat. Comum quando:

- O nó **Respond to Webhook** está sendo usado — ele **não funciona** com Chat Trigger para enviar respostas ao chat.
- O **Response Mode** do Chat Trigger está incorreto.
- O **AI Agent** não está conectado diretamente ao Chat Trigger.

**Solução — estrutura correta do workflow:**

1. **Chat Trigger** → conecte **diretamente** ao nó **AI Agent** (sem Respond to Webhook no meio).
2. No **Chat Trigger** → Options → **Response Mode** = **"What Last Node Finishes"** (usa a saída do último nó).
3. **Não use** o nó "Respond to Webhook" para enviar a resposta do chat — o Chat Trigger envia automaticamente a saída do AI Agent.
4. Se usar N8N &lt; 1.56.0, atualize para 1.56.0+ (suporte melhorado ao Chat Trigger).

**Fluxo esperado:** Chat Trigger → AI Agent → (resposta enviada automaticamente ao chat)

### 7.10 Erro: "No item to return was found"

**Causa:** O Chat Trigger espera que o último nó retorne `output` ou `text`. O fluxo pode ter nós após o AI Agent (ex.: envio para WhatsApp) ou o AI Agent não está recebendo/configurando a mensagem corretamente.

**Solução:**

1. O **AI Agent deve ser o último nó** — remova ou desconecte nós que vêm depois (envio WhatsApp, etc.).
2. No AI Agent, use **"From Connected Chat Trigger"** no Prompt, ou `{{ $json.chatInput }}` para a mensagem do usuário.
3. Response Mode do Chat Trigger = **"What Last Node Finishes"**.

---

## 8. Resumo de Acesso por Tabela

| Tabela | SELECT (anon) | SELECT (auth) | INSERT | UPDATE | DELETE |
|--------|---------------|--------------|-------|--------|--------|
| profiles | ✓ | ✓ | admin | admin | admin |
| settings | parcial | gerente+ | admin | admin | - |
| audit_log | - | admin | auth | - | - |
| clients | - | analista+ | gerente+ | gerente+ | gerente+ |
| client_documents | - | analista+ | gerente+ | gerente+ | gerente+ |
| client_tracking_events | - | analista+ | **todos** | - | - |
| bot_config | ✓ | ✓ | gerente+ | gerente+ | gerente+ |
| utm_links | - | marketing+ | marketing+ | marketing+ | marketing+ |
| tracking_systems | ✓ | ✓ | gerente+ | gerente+ | gerente+ |
| spreadsheets | ✓ | ✓ | gerente+ | gerente+ | gerente+ |
| spreadsheet_pages | ✓ | ✓ | gerente+ | gerente+ | gerente+ |
| car_images | ✓ | ✓ | gerente+ | gerente+ | gerente+ |

**Service Role Key:** Bypassa todas as restrições RLS.

---

## 9. Referência PostgREST

A API REST do Supabase segue o [PostgREST](https://postgrest.org/). Documentação completa: https://postgrest.org/en/stable/references/api.html

**Operadores úteis:**
- `eq` = igual
- `neq` = diferente
- `gt`, `gte`, `lt`, `lte` = comparação
- `like`, `ilike` = padrão (ilike = case insensitive)
- `in` = em lista
- `or` = OU lógico
- `and` = E lógico

---

## 10. Fluxos Comuns N8N

### Cadastrar lead vindo do site/formulário
1. Webhook recebe dados (nome, email, telefone, UTM)
2. HTTP Request: POST `/rest/v1/clients` com body
3. (Opcional) Enviar email/WhatsApp de confirmação

### Registrar evento de página
1. Webhook ou Schedule + HTTP Request
2. POST `/rest/v1/client_tracking_events` (anon key)
3. Payload: visitor_id, event_type, page_url, utm_*, session_id

### Sincronizar clientes com planilha/CRM externo
1. Schedule ou Webhook
2. GET `/rest/v1/clients` com filtros
3. Processar e enviar para Google Sheets, HubSpot, etc.

### Atualizar status do funil
1. Webhook ou lógica externa
2. PATCH `/rest/v1/clients?id=eq.{id}` com funnel_stage, credit_status

### Consultar configuração do bot
1. GET `/rest/v1/bot_config` (anon key)
2. Usar webhook_url para enviar respostas ao chat
