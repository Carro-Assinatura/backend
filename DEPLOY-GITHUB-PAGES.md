# Deploy do site no GitHub Pages

O site principal (front_end_multi) é publicado automaticamente no GitHub Pages a cada push na branch `main`.

## URL do site

- **Domínio principal:** https://multi.kingsengine.tech
- **GitHub Pages (alternativo):** https://carro-assinatura.github.io/backend/

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

### 3. Domínio customizado (multi.kingsengine.tech)

1. Em **Settings** → **Pages** → **Custom domain**, informe: `multi.kingsengine.tech`
2. No provedor de DNS (onde o domínio kingsengine.tech está), adicione:
   - **Tipo:** CNAME
   - **Nome:** `multi` (ou `multi.kingsengine.tech` dependendo do provedor)
   - **Valor:** `carro-assinatura.github.io`
3. O build já usa base `/` por padrão (raiz do domínio)

## Como funciona

- **Push em `main`** → dispara o workflow automaticamente
- **Manual** → Actions → Deploy site no GitHub Pages → Run workflow

O build gera os arquivos estáticos em `front_end_multi/dist` e publica no GitHub Pages.

## Site não atualizou?

1. **Confira qual URL está usando:**
   - GitHub Pages: https://carro-assinatura.github.io/backend/
   - Domínio customizado: https://www.multiexperiencias.com

2. **Se usa www.multiexperiencias.com:**
   - O domínio precisa estar configurado em **Settings** → **Pages** → **Custom domain**
   - O DNS deve apontar para o GitHub Pages (registros A ou CNAME conforme instruções)
   - Adicione o secret `VITE_BASE_PATH` com valor `/` (para domínio na raiz)

3. **Se o domínio aponta para outro host** (Lovable, Vercel, etc.):
   - O deploy no GitHub não altera esse site
   - É preciso configurar o deploy na plataforma onde o domínio está apontando

4. **Cache do navegador:** Tente Ctrl+Shift+R (hard refresh) ou abra em aba anônima.
