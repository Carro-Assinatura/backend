# Fin Camp — Documentação do Módulo

## Visão geral

O **Fin Camp** é um dashboard analítico e comercial para rastrear, consolidar e exibir a performance de campanhas, comportamento de leads e conversão via UTM. Focado em decisão rápida e eficiência de venda.

---

## Arquivos criados/alterados

### Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/admin/FinCampPage.tsx` | Página principal do Fin Camp com filtros, KPIs, gráficos, funil e tabela |
| `src/services/finCampApi.ts` | Camada de dados: agregação de eventos e clientes, preparada para BigQuery |
| `src/components/fin-camp/FinCampKPICard.tsx` | Card de KPI com tooltip e variação percentual |
| `src/components/fin-camp/FinCampChartBlock.tsx` | Bloco reutilizável de gráfico (barra, pizza, horizontal) |
| `supabase-fin-camp-utm.sql` | Migration para adicionar `utm_content` e `utm_term` nas tabelas |

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/AdminLayout.tsx` | Grupo "Dashboard" com "Visão Geral" e "Fin Camp", ícone BarChart2 |
| `src/App.tsx` | Rota `/admin/fin-camp` |
| `src/pages/admin/Dashboard.tsx` | Card "Fin Camp" para acesso rápido |

---

## Rotas criadas

| Rota | Componente | Acesso |
|------|------------|--------|
| `/admin/fin-camp` | `FinCampPage` | Analista+ |

---

## Componentes criados

| Componente | Uso |
|------------|-----|
| `FinCampKPICard` | Exibe KPI com valor, variação e tooltip explicativo |
| `FinCampChartBlock` | Gráfico de barras (vertical/horizontal) ou pizza com empty state |
| `FinCampPage` | Página completa com filtros, KPIs, blocos de gráficos, funil e tabela |

---

## Serviços e consultas

### `finCampApi.ts`

| Função | Descrição |
|-------|-----------|
| `getUniqueVisitors(filters)` | Visitantes únicos por `visitor_id` em eventos do tipo pageview |
| `getEventsForFinCamp(filters)` | Eventos de tracking do período filtrado |
| `getClientsForFinCamp(filters)` | Clientes (leads) do período filtrado |
| `getDocumentsForFinCamp(filters)` | Quantidade de documentos enviados |
| `getFilterOptions(filters)` | Valores únicos para popular os filtros (UTM, device, city, etc.) |
| `getFinCampKPIs(filters)` | KPIs agregados (visitantes, leads, conversões, taxas, receita) |
| `getFunnelData(filters)` | Funil completo com etapas e taxas de conversão |
| `getLeadsByUtmSource(filters)` | Leads agrupados por UTM Source |
| `getLeadsByUtmCampaign(filters)` | Leads agrupados por UTM Campaign |
| `getContratosByUtmCampaign(filters)` | Contratos assinados por campanha |
| `getReceitaByUtmCampaign(filters)` | Receita por campanha |
| `getVisitorsByLandingPage(filters)` | Visitantes por página de entrada |
| `getAvgTimeByCampaign(filters)` | Tempo médio na página por campanha |
| `getFinCampLeadsTable(filters, opts)` | Tabela paginada de leads para exportação |

### Fontes de dados atuais

- **Supabase**: `client_tracking_events`, `clients`, `client_documents`
- **BigQuery**: Estrutura preparada; substituir chamadas em `finCampApi.ts` quando houver camada consolidada

---

## Dependências

Nenhuma dependência nova. Utiliza:

- `recharts` (já no projeto)
- `date-fns` (já no projeto)
- `@supabase/supabase-js`
- Componentes Shadcn UI (Select, Input, Button, Tooltip)

---

## Filtros globais

- Período (dateFrom, dateTo)
- UTM Source, Medium, Campaign
- Dispositivo
- Estado, Cidade
- Perfil (PF/PJ)
- Status do lead, crédito e contrato

Persistência: `sessionStorage` (`fin-camp-filters`).

---

## Eventos considerados

Mapeamento com a estrutura existente:

| Evento espec | Evento no projeto |
|--------------|-------------------|
| page_view | pageview |
| landing_view | pageview (primeira página) |
| cta_click | (a implementar no VisitorTracker) |
| whatsapp_click | (a implementar) |
| chatbot_opened | (a implementar) |
| lead_created | Cliente em `clients` |
| documents_sent | Registro em `client_documents` |
| credit_approved | `credit_status = 'aprovado'` |
| credit_denied | `credit_status = 'reprovado'` |
| contract_signed | `contract_status = 'ativo'` |

---

## Integração BigQuery

Para usar BigQuery como camada principal:

1. Criar views/tabelas no BigQuery com schema compatível (`sessions`, `leads`, `utm_attribution`, `events`, etc.).
2. Expor API (Edge Function, backend) que consulte o BigQuery e retorne JSON no formato esperado.
3. Em `finCampApi.ts`, trocar as chamadas ao Supabase por chamadas a essa API.
4. Manter fallback para Supabase quando BigQuery não estiver disponível.

---

## Execução do SQL

Execute no Supabase SQL Editor, na ordem:

1. `supabase-marketing.sql` (se ainda não executado)
2. `supabase-fin-camp-utm.sql` (adiciona utm_content e utm_term)
