# Prompt mestre — Plataforma SaaS White Label multi-empresa

Use este documento como **briefing único** para arquitetura, desenvolvimento e integrações. Pode ser colado em ferramentas de IA, enviado a fornecedores ou usado como PRD interno.

---

## Base legada — Carro por Assinatura (repositório **Multi**)

**Não reescrever do zero.** O produto atual **Carro por Assinatura** já implementa a maior parte dos **módulos funcionais** descritos abaixo, em arquitetura **mono-tenant** (um único negócio, sem `tenant_id`).

| Camada | O que já existe |
|--------|------------------|
| **Frontend** | React + Vite (`front_end_multi/`) — site público, intranet admin, abas de configuração, importação de planilhas, CRM, etc. |
| **Backend de dados** | **Supabase** (PostgreSQL + Auth + Storage + RLS por **role**, não por empresa) |
| **Integração externa** | N8N / automações documentadas em `API-DOCUMENTATION-N8N.md` (REST Supabase, Service Role, papéis `admin` / `gerente` / `marketing` / `analista`) |
| **Migrations SQL** | Vários arquivos `supabase-*.sql` e `supabase-migration-*.sql` na raiz do repositório **Multi** |

**Objetivo da evolução white label:** introduzir **`tenants` + `tenant_id` + intranet master**, manter **o mesmo núcleo de features** como **módulos licenciáveis**, e isolar dados por empresa. O vertical **carro por assinatura** vira o **primeiro tenant de referência** (dados atuais → `tenant_id` default após migração).

---

## Inventário técnico → catálogo de módulos (reaproveitamento)

Mapear **cada área já desenvolvida** a um **`code` estável** no catálogo. Rotas, RLS e UI devem consultar `subscription_modules` / feature flags antes de expor a funcionalidade.

| `code` (módulo) | Tabelas / artefatos principais | Observação |
|-----------------|--------------------------------|------------|
| **`core_site`** | `settings` (branding, WhatsApp, SEO, título do site), site público, chaves públicas já documentadas | Hoje `settings` é global; passa a ser **por tenant** (ou `settings` com `tenant_id`). |
| **`rbac`** | `profiles`, `user_roles`, `role_permissions`, Supabase Auth | Hoje roles são globais; evoluir para **escopo tenant** + opcional role **super_admin** (plataforma) fora de `tenant_id`. |
| **`audit`** | `audit_log` | Log por tenant; ações master em tabela ou flag `platform_only`. |
| **`crm_clients`** | `clients`, `client_documents`, vínculo visitante (`visitor_id` em migrations) | CRM completo PF/PJ, funil, contrato, crédito — já implementado. |
| **`tracking_analytics`** | `tracking_systems`, `client_tracking_events` | GTM, GA, Clarity, etc. |
| **`utm_campaigns`** | `utm_links` | Links rastreados / marketing. |
| **`automation_bot`** | `bot_config` | Integração bot / N8N. |
| **`spreadsheets`** | `spreadsheets`, `spreadsheet_pages`, settings de importação (`import_*` em `settings`) | Planilhas dinâmicas + UI de importação no admin. |
| **`testimonials`** | `testimonials` | Depoimentos. |
| **`vertical_car_subscription`** | `car_prices`, `car_images`, `car_brand_mappings`, `car_category_mappings` | **Vertical específico**; `vertical_tags: ["car_subscription"]`. Outros tenants podem não contratar este módulo. |

**Documentação viva do legado:** `API-DOCUMENTATION-N8N.md` (contratos de API/tabelas para N8N) deve ser **versionada** (`/v1`) e atualizada quando o multi-tenant entrar (ex.: header ou claim `tenant_id` para automações).

**Frontend:** reutilizar componentes e páginas em `front_end_multi/` (ex.: `SettingsPage`, abas de importação, CRM, tracking) protegidos por **gate de módulo** + contexto de tenant.

---

## Contexto e visão

Construir uma **plataforma SaaS white label** que permita vender o mesmo núcleo de software — **extraído e generalizado a partir do Carro por Assinatura (Multi)** — para **diversos tipos de negócio** (ex.: carro por assinatura, barbearia, clínica de estética, lava-jato, outros estabelecimentos). Cada cliente da plataforma é uma **empresa white label** com marca própria, domínio/subdomínio, dados isolados e **módulos contratados sob pagamento**.

Existem **dois mundos financeiros** distintos e explícitos:

1. **Receita da plataforma (vocês):** mensalidades e módulos pagos por cada white label (cartão de crédito e/ou PIX).
2. **Receita do white label:** pagamentos que **os clientes finais** daquela empresa fazem **para o white label**; o sistema deve permitir que cada empresa cadastre **meios de recebimento próprios** (PIX, cartão via adquirente/gateway de escolha).

---

## Objetivos principais

- **Multi-empresa (multi-tenant):** isolamento lógico e de dados por empresa white label (**evolução do schema mono-tenant atual**).
- **Intranet master (super admin):** cadastro e gestão de white labels, domínios, planos, módulos, cobrança da plataforma e visão financeira consolidada.
- **Intranet por empresa:** administradores de cada white label gerenciam só o que pertence à sua empresa (conforme módulos contratados) — **equivalente à intranet atual**, filtrada por `tenant_id` e módulos.
- **Site/app público por tenant:** landing, cadastros, tracking e fluxos específicos do vertical, com branding por empresa (**reuso do site atual** com resolução de tenant por host).
- **Controle financeiro duplo:**  
  - **Plataforma:** faturas, assinaturas, renovações, inadimplência, histórico de pagamentos dos white labels.  
  - **White label:** conciliação e registros dos recebimentos dos **clientes finais** (quando o produto exigir).
- **Cobrança da plataforma:** assinatura recorrente + **módulos com valor agregado**; pagamento via **cartão de crédito** e **PIX** (com QR Code / copia e cola onde aplicável).
- **Módulos licenciáveis:** cada funcionalidade relevante é um **módulo** com preço; a empresa contrata só o que precisa; a UI e as APIs respeitam o que está ativo (**enforcement alinhado à tabela de inventário acima**).
- **APIs de pagamento “prontas”:** camada de integração abstrata (adapter pattern) com implementações concretas; o cliente white label **só configura credenciais e chaves** no painel, sem reescrever código por banco.

---

## Personas e permissões

| Persona | Descrição |
|--------|-----------|
| **Super Admin (plataforma)** | Acessa intranet master; cria/edita white labels; define preços de planos e módulos; vê financeiro global; suporte e auditoria. |
| **Admin do white label** | Gestão da própria empresa: branding, domínios, usuários internos, módulos contratados (visualização), configuração de gateways para **recebimento dos clientes finais**, CRM, relatórios permitidos. |
| **Usuários operacionais** | Papéis granulares por empresa (ex.: financeiro, marketing, atendimento), limitados por módulo — **mapear a partir de** `profiles.role` + `role_permissions` atuais. |
| **Visitante / cliente final** | Interage com o site/checkout do white label; pagamentos vão para as contas/credenciais configuradas pelo white label (quando houver checkout). |

---

## Requisitos funcionais — Intranet master

- CRUD de **empresas (tenants / white labels)** com: nome fantasia, razão social, documento, slug, status (trial, ativo, suspenso, cancelado).
- Associação de **domínios**: subdomínio na infraestrutura da plataforma (ex.: `barbearia.dominiodaplataforma.com`) e **domínio customizado** (ex.: `cliente.com.br` → verificação DNS/CNAME).
- **Catálogo de módulos** com nome, descrição, código técnico estável (`code` da tabela de inventário), **preço mensal** (e opcionalmente preço de setup), `dependencies[]`, `vertical_tags[]`.
- **Planos base** (opcional) + composição por módulos; ou apenas “mensalidade base + add-ons de módulos”.
- **Assinaturas da plataforma:** vínculo empresa ↔ plano/módulos ativos; data de renovação; trial; histórico de alterações de módulos.
- **Cobrança para a plataforma:** geração de faturas/cobranças; integração com gateway para **cartão** (recorrência quando possível) e **PIX**; webhooks de confirmação; conciliação.
- **Dashboard financeiro master:** MRR, churn, inadimplentes, receita por módulo, por empresa.
- **Auditoria:** log de ações críticas (quem alterou módulo, suspendeu empresa, etc.).

---

## Requisitos funcionais — Empresa white label

- Painel próprio com **isolamento total** de dados de outras empresas.
- Configuração de **marca**: logo, favicon, cores, textos legais, redes, WhatsApp, etc. (**derivado do módulo `core_site` / `settings` atual**).
- **Gestão de módulos contratados** (somente leitura ou upgrade solicitado, conforme política comercial).
- **Recebimento dos clientes finais:**  
  - Cadastro de **chave PIX** (tipo e chave) para exibição/instruções ou integração com PSP.  
  - Cadastro de **credenciais de gateway/adquirente** para cartão (por ambiente sandbox/produção).  
  - Regra clara: **pagamentos de clientes finais não passam obrigatoriamente pela conta da plataforma** (split/marketplace só se produto exigir); padrão = **dinheiro vai para o white label**.
- Relatórios permitidos pelos módulos (ex.: CRM, tracking, financeiro local).

---

## Requisitos — Módulos (catálogo alinhado ao legado + extensões)

Definir catálogo versionado. **Mínimo para MVP white label:** incluir todos os códigos da seção **Inventário técnico → catálogo de módulos**.

Exemplos de **novos** módulos (não existem como produto fechado hoje no Multi — planejar apartado):

- **Agendamento** (vertical barbearia/clínica)  
- **Financeiro avançado** (conciliação, DRE simplificada) — se aplicável  

Cada módulo: `code`, `name`, `description`, `price_monthly`, `dependencies[]`, `vertical_tags[]` (opcional).

**Enforcement:** backend e RLS devem negar acesso a dados e rotas de módulos não contratados.

---

## Arquitetura técnica (diretrizes)

- **Single codebase** (evolução do **Multi** / `front_end_multi` **ou** consolidação no repositório `white_label_saas` com **extração de pacotes compartilhados**), deploy único (ex.: Vercel + Supabase ou stack equivalente), com **resolução de tenant** por: `Host` (domínio customizado), subdomínio, ou header em API.
- **Modelo de dados:** tabela `tenants` (empresas); `tenant_id` em **todas** as tabelas de negócio listadas no inventário; `tenant_domains`; `subscriptions` (plataforma); `subscription_modules`; `module_catalog`; `platform_invoices` / `platform_payments`.
- **Pagamentos clientes finais:** tabelas `tenant_payment_profiles` ou `tenant_gateway_credentials` (criptografadas em repouso), `payment_providers` enum.
- **Segurança:** RLS no Postgres por `tenant_id` **e** papéis; JWT ou session com `tenant_id` e roles; segredos nunca em front-end em claro.
- **APIs:** REST Supabase (como hoje) ou Edge Functions com versionamento (`/v1/...`); documentação OpenAPI; **atualizar** `API-DOCUMENTATION-N8N.md` para multi-tenant.

---

## Camada de pagamentos — abstração e PSPs

Implementar um **Payment Provider Interface** comum, por exemplo:

- `createCharge`, `createSubscription`, `refund`, `webhookHandler`, `getPixQrCode`, `tokenizeCard` (conforme suporte de cada PSP).

**Provedores a prever implementação ou adapter stub + documentação de credenciais** (nomes normalizados):

| Provedor | Observação |
|-----------|------------|
| **Mercado Pago** (Mercado Livre / MP) | PIX, cartão, assinaturas conforme API atual. |
| **PagBank** | Ex-PagSeguro v2; unificar com PagSeguro se API convergir. |
| **Itaú** | API banking / cobrança conforme produto contratado pelo white label. |
| **Santander** | Cobrança / API disponível ao PJ. |
| **Caixa** | Boletos/PIX conforme produtos da instituição. |
| **Bradesco** | APIs de cobrança. |
| **PagSeguro** | Gateway e-commerce. |
| **Stone** | Adquirência. |
| **Rede** | Itaú Rede / e.Rede. |
| **Cielo** | Braspag / Cielo e-commerce. |
| **Inter** | Banking / cobrança / PIX. |
| **Infini Pay** | Conforme documentação oficial do provedor. |
| **Nubank** | NuPay / APIs empresariais disponíveis para parceiros. |

**Importante:** muitos desses nomes agregam **vários produtos** (PIX direto, gateway e-commerce, adquirência). O prompt exige **mapear cada um para o produto real** (documentação oficial) e implementar **adapters**; não misturar “conta PJ” com “gateway de loja” sem especificação.

**Para a plataforma (cobrança do white label):** escolher 1–2 PSPs **estratégicos** para MVP (ex.: Mercado Pago + PIX) e expandir.  
**Para o white label (recebimento dos clientes):** o painel permite **selecionar provedor** e preencher credenciais; o sistema chama o adapter correspondente.

---

## Entregáveis esperados (para quem for desenvolver)

1. Diagrama ER com `tenants`, domínios, assinaturas, módulos, pagamentos plataforma vs pagamentos tenant **+ relação com tabelas legadas** (`clients`, `car_prices`, etc.).
2. Matriz de permissões (RBAC) master vs tenant (**incluir migração** desde `admin` / `gerente` / `marketing` / `analista`).
3. Fluxo de onboarding: criação de empresa → DNS → primeiro pagamento → liberação de módulos.
4. Especificação OpenAPI dos endpoints públicos e admin (e revisão da doc N8N).
5. **Plano de migração explícito:** repositório **Multi** (mono-tenant) → adicionar `tenant_id` em todas as tabelas de negócio → **backfill** com um único `tenant_id` (Carro por Assinatura) → validar RLS e app → novos tenants em seguida.
6. Política de LGPD: dados por empresa, exportação, exclusão.
7. Testes: isolamento entre tenants (testes automatizados de RLS).

---

## Critérios de sucesso

- Nenhum dado de empresa A acessível por empresa B (testes e auditoria).  
- Super admin cobra e renova assinatura com cartão e PIX.  
- White label configura recebimento próprio sem deploy novo.  
- Módulo desligado = UI invisível + API 403 + queries impossibilitadas por RLS.  
- Novo PSP adicionado sem alterar regras de negócio centrais (só novo adapter + config).  
- **100% das features listadas no inventário do Multi** permanecem disponíveis para o tenant que contratar os módulos correspondentes (paridade funcional pós-migração).

---

## Como usar este prompt

Cole o bloco abaixo em uma conversa com IA ou anexo junto a este arquivo:

```
Quero implementar uma plataforma SaaS white label multi-tenant conforme o documento PROMPT-WHITE-LABEL-SAAS.md anexo.

BASE LEGADA: repositório Carro por Assinatura (Multi) — React/Vite front_end_multi, Supabase, SQL na raiz (supabase-*.sql), doc N8N em API-DOCUMENTATION-N8N.md. Não descartar esse código: evoluir para multi-tenant com tenant_id, intranet master e catálogo de módulos mapeado ao inventário do documento (core_site, rbac, crm_clients, vertical_car_subscription, etc.).

Priorize: (1) modelo de dados e RLS a partir do schema atual + tenants/subscriptions, (2) intranet master + billing da plataforma com PIX e cartão, (3) enforcement de módulos com preço alinhado ao legado, (4) camada abstrata de pagamentos com adapters para os PSPs listados, (5) configuração pelo white label para receber pagamentos dos clientes finais, (6) plano de migração com tenant default para os dados atuais.

Entregue primeiro o desenho arquitetural e o schema SQL; depois o plano de fases de implementação.
```

---

*Documento gerado como especificação mestre — ajuste nomes de produtos bancários conforme contratos e APIs vigentes no Brasil.*
