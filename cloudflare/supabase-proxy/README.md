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

## Diagnóstico (Claro 5G / outras redes)

Há **duas** camadas diferentes; confunde-se com facilidade:

1. **Build do site** (`multi.kingsengine.tech`, Vercel, etc.)  
   O Vite embute `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` **na compilação**. Se faltarem, o bundle usa `invalid-env-not-set.supabase.co` e **nada** funciona em **qualquer** rede (Wi‑Fi ou 5G). Corrige nas variáveis de ambiente do host e faz **redeploy**.

2. **Proxy Cloudflare** (este Worker)  
   Só ajuda quando o site já aponta para o proxy, por exemplo `VITE_SUPABASE_URL=https://sup.kingsengine.tech`.  
   Aí o telemóvel fala com a **Cloudflare** (DNS normalmente resolve); o Worker é que fala com `*.supabase.co` a partir dos datacenters da Cloudflare (onde o DNS do Supabase costuma funcionar).

**Teste no 5G (sem precisar de chave Supabase no browser):**

- Abre no telemóvel:  
  `https://sup.kingsengine.tech/__multi_supabase_proxy_health`  
  Resposta esperada: `{"worker":"ok","upstreamConfigured":true}`  
  - Se **não abrir** (timeout / DNS) → problema de **domínio/DNS/Cloudflare** (zona `kingsengine.tech`, custom domain no Worker, ou rede a bloquear).  
  - Se `upstreamConfigured` for **false** → falta ou está errado o secret **`SUPABASE_HOST`** no Worker (`npx wrangler secret put SUPABASE_HOST` + `npm run deploy`).  
- Depois: `https://sup.kingsengine.tech/rest/v1/` — **401/406** com JSON é normal sem headers; o importante é **não** ser `ERR_NAME_NOT_RESOLVED`.

**Se “antes funcionava” no 5G:** faz `npm run deploy` nesta pasta outra vez (código ou secrets na Cloudflare podem ter sido alterados). Confirma no Dashboard do Worker que o **custom domain** `sup.kingsengine.tech` continua ligado a este worker.

## Notas

- **Realtime (WebSocket)** não passa por este proxy; este projecto usa sobretudo REST + Auth.
- **Chave anon** continua a ir no browser (como hoje); o proxy não substitui o modelo de segurança do Supabase.
- Se no futuro precisares de ajustar CORS, edita `handleOptions` / `CORS_HEADERS_FALLBACK` em `src/index.ts`.
