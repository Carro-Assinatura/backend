# Proxy Supabase (`sup.kingsengine.tech`)

Encaminha `https://sup.kingsengine.tech/*` para o teu projeto `https://<ref>.supabase.co/*`, para contornar falhas de DNS em redes móveis (ex.: 5G).

## O que precisas de fazer (uma vez)

1. **Domínio na Cloudflare**  
   Garante que `kingsengine.tech` usa os nameservers da Cloudflare (zona activa no teu login).

2. **Instalar dependências do Worker** (nesta pasta):

   ```bash
   cd cloudflare/supabase-proxy
   npm install
   ```

3. **Login Wrangler** (se ainda não fizeste):

   ```bash
   npx wrangler login
   ```

4. **Secret com o host real do Supabase** (só o hostname, **sem** `https://`):

   ```bash
   npx wrangler secret put SUPABASE_HOST
   ```

   Cola o valor que aparece em Supabase → **Project Settings → API → Project URL**  
   (ex.: se a URL for `https://abcxyzcompany.supabase.co`, o secret é `abcxyzcompany.supabase.co`).

5. **Deploy do Worker**

   ```bash
   npm run deploy
   ```

   Se o Wrangler perguntar pelo subdomínio **`.workers.dev`**, isso **não** é o `sup.kingsengine.tech`.  
   Responde com um nome curto **sem pontos**, por exemplo: `multi-supabase-proxy` ou `kingsengine-multi-sup`.  
   O teu domínio próprio configuras só no passo 6.

6. **Ligar o domínio `sup.kingsengine.tech` ao Worker**  
   Cloudflare Dashboard → **Workers & Pages** → abre o worker **`multi-supabase-proxy`** → **Settings** → **Domains & Routes** → **Add** → **Custom Domain** → `sup.kingsengine.tech`.  
   A Cloudflare cria o registo DNS (proxied) por ti.

7. **Testar no browser** (noutra rede ou depois de DNS propagar):

   `https://sup.kingsengine.tech/rest/v1/`  
   Deve devolver JSON do PostgREST (erro 401/406 é normal sem headers; o importante é **não** ser `ERR_NAME_NOT_RESOLVED`).

8. **Front-end** (`front_end_multi/.env` e envs de build):

   ```env
   VITE_SUPABASE_URL=https://sup.kingsengine.tech
   VITE_SUPABASE_ANON_KEY=<a mesma anon key de sempre>
   ```

   Reinicia `npm run dev`. Em Vercel / GitHub Actions, actualiza as variáveis ou secrets com a **mesma** URL do proxy.

## Depois de alterar o código do Worker

```bash
cd cloudflare/supabase-proxy && npm run deploy
```

## Supabase → Auth (evitar login / sessão estranhos)

**Authentication → URL Configuration** em [supabase.com](https://supabase.com):

- **Site URL**: URL principal do site em produção (ex.: `https://multi.kingsengine.tech`).
- **Redirect URLs**: inclui todas as origens onde o site corre (GitHub Pages, Vercel previews, `http://localhost:8080`, URL do Worker se usares OAuth).

Sem isto, password pode funcionar mas **magic link / OAuth** podem falhar.

## Notas

- **Realtime (WebSocket)** não passa por este proxy; este projecto usa sobretudo REST + Auth.
- **Chave anon** continua a ir no browser (como hoje); o proxy não substitui o modelo de segurança do Supabase.
- Se no futuro precisares de mais origens CORS, edita `allowOrigin()` em `src/index.ts`.
