# Deploy do site no GitHub Pages

O site principal (front_end_multi) é publicado automaticamente no GitHub Pages a cada push na branch `main`.

## URL do site

- **GitHub Pages (padrão):** https://carro-assinatura.github.io/backend/
- **Domínio customizado:** Configure em Settings → Pages → Custom domain (ex: www.multiexperiencias.com)

## Configuração necessária

### 1. Ativar o GitHub Pages

1. Acesse o repositório: https://github.com/Carro-Assinatura/backend
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **GitHub Actions**

### 2. Adicionar Secrets (variáveis de ambiente)

Em **Settings** → **Secrets and variables** → **Actions**, crie os seguintes secrets:

| Secret | Descrição |
|--------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `VITE_GOOGLE_SHEETS_API_KEY` | Chave da API Google Sheets |
| `VITE_GOOGLE_SHEETS_ID` | ID da planilha |
| `VITE_GOOGLE_SHEETS_TAB` | Nome da aba (ex: Página1) |
| `VITE_COLUMN_CAR_NAME` | Nome da coluna do carro |
| `VITE_COLUMN_CATEGORY` | Nome da coluna da categoria |
| `VITE_COLUMN_PRICE` | Nome da coluna do preço |
| `VITE_COLUMN_IMAGE` | Nome da coluna da imagem |
| `VITE_REMOVEBG_API_KEY` | (Opcional) Chave Remove.bg |

Copie os valores do seu arquivo `.env` local.

### 3. Domínio customizado (opcional)

Se usar www.multiexperiencias.com:

1. Em **Settings** → **Pages** → **Custom domain**, informe o domínio
2. Configure o DNS conforme instruções do GitHub
3. Adicione o secret `VITE_BASE_PATH` com valor `/` no workflow (ou edite o `vite.config.ts` para usar base `/` em produção)

## Como funciona

- **Push em `main`** → dispara o workflow automaticamente
- **Manual** → Actions → Deploy site no GitHub Pages → Run workflow

O build gera os arquivos estáticos em `front_end_multi/dist` e publica no GitHub Pages.
