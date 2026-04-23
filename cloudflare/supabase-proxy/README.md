# Proxy Supabase (`sup.kingsengine.tech`)

Encaminha `https://sup.kingsengine.tech/*` para o teu projeto `https://<ref>.supabase.co/*`, para contornar falhas de DNS em redes móveis (ex.: 5G).

## O que precisas de fazer (uma vez)

1. **Domínio na Cloudflare**  
   Garante que `kingsengine.tech` usa os nameservers da Cloudflare (zona activa no teu login).  
   *Se o domínio está registado na **Hostinger**, vê a secção [Domínio na Hostinger](#domínio-na-hostinger-nameservers--dns) abaixo.*

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

## Domínio na Hostinger (nameservers + DNS)

O registo do domínio pode ficar na **Hostinger** para sempre. O que muda é **quem responde pelo DNS** (registos A, CNAME, etc.): para o Worker `sup.kingsengine.tech` funcionar de forma estável, a zona **`kingsengine.tech` deve estar na Cloudflare** (plano gratuito chega).

### Passo A — Criar a zona na Cloudflare

1. Entra em [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site** → escreve `kingsengine.tech`.
2. Escolhe o plano **Free** → a Cloudflare importa os registos DNS que conseguir (revê a lista).
3. A Cloudflare mostra **dois nameservers** (ex.: `ada.ns.cloudflare.com` e `bob.ns.cloudflare.com`). **Copia os dois.**

### Passo B — Apontar o domínio para a Cloudflare (na Hostinger)

1. Na **Hostinger** → **Domínios** → selecciona `kingsengine.tech` → **DNS / Nameservers** (ou “Alterar nameservers”).
2. Opção **“Usar nameservers personalizados”** / **Custom nameservers**.
3. Cola **exactamente** os dois nameservers que a Cloudflare deu → **Guardar**.

> O domínio continua **registado na Hostinger**; só estás a dizer à Internet: “pergunta à Cloudflare onde está o `multi`, o `sup`, o `@`, etc.”

A propagação pode levar de **minutos a 48 h** (muitas vezes menos de duas horas). Na Cloudflare, a zona fica **Active** quando estiver ok.

### Passo C — Recriar na Cloudflare o que já tinhas (importante)

Assim que a zona estiver na Cloudflare, **nenhum** registo antigo da Hostinger “segue” automaticamente se não foi importado. Confirma na Cloudflare → **DNS** → **Records**:

| Tipo | Nome | Destino / conteúdo | Proxy |
|------|------|---------------------|--------|
| **CNAME** | `multi` | O que a **Vercel** pede para o teu projecto (ex.: `cname.vercel-dns.com` — vê **Project → Settings → Domains**) | Em geral **DNS only** (nuvem cinzenta), como a Vercel recomenda com Cloudflare |
| **CNAME** | `sup` | *Opcional criar à mão:* costuma ser criado **automaticamente** quando adicionas **Custom Domain** `sup.kingsengine.tech` no Worker | **Proxied** (nuvem laranja), se a Cloudflare criar o registo |

Se o site `multi.kingsengine.tech` deixar de abrir depois da mudança, falta ou está errado o CNAME **`multi`** → corrige com o valor exacto da Vercel (**Settings → Domains** do projecto).

### Passo D — Worker + `sup.kingsengine.tech`

Com a zona **Active** na Cloudflare:

1. Faz o deploy do Worker (`npm run deploy` nesta pasta, com `SUPABASE_HOST` definido).
2. **Workers & Pages** → worker **`multi-supabase-proxy`** → **Settings** → **Domains & Routes** → **Add** → **Custom Domain** → `sup.kingsengine.tech`.
3. A Cloudflare adiciona o registo DNS do **`sup`** (normalmente proxied). Espera alguns minutos.
4. Testa: `https://sup.kingsengine.tech/__multi_supabase_proxy_health` → deve responder `{"worker":"ok","upstreamConfigured":true}`.

### Se não quiseres mudar nameservers agora

Usa temporariamente a URL **`https://<teu-worker>.<conta>.workers.dev`** (aparece no dashboard do Worker) como `VITE_SUPABASE_URL` na Vercel e faz redeploy — não dependes do `sup` nem da Hostinger para o DNS do proxy.

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

### `dig sup.kingsengine.tech` vazio (subdomínio não existe na Internet)

Se no Mac ou num serviço online de DNS o resultado for **vazio**, nenhum browser na Claro 5G (nem noutra rede) consegue falar com o proxy — **não é bug do código**.

Causas típicas:

- O domínio **`kingsengine.tech` não está com a zona DNS na Cloudflare** (ex.: só o `multi` está na Vercel via CNAME, mas ninguém criou o registo **`sup`**).
- O **custom domain** do Worker foi removido ou nunca foi concluído no dashboard.

**Correcção (escolhe uma):**

1. **Zona na Cloudflare** — Workers → `multi-supabase-proxy` → **Domains** → **Add** → `sup.kingsengine.tech` (a Cloudflare cria o DNS se a zona `kingsengine.tech` estiver lá).  
2. **DNS fora da Cloudflare** — no sítio onde geres os DNS do `kingsengine.tech`, cria o registo que a Cloudflare indica ao adicionares o custom domain ao Worker (muitas vezes um CNAME para `*.workers.dev` ou o target que o assistente de domínio mostrar).  
3. **Solução rápida sem `sup.*`:** no dashboard do Worker, copia a URL **`https://<nome-do-worker>.<subdomínio-da-conta>.workers.dev`**, coloca-a em **`VITE_SUPABASE_URL`** na **Vercel** (Production) e faz **Redeploy**. Esse hostname da Cloudflare costuma resolver bem na Claro enquanto não arranjas o `sup.kingsengine.tech`.

**Confirma também o site (Vercel):** o bundle **não** pode conter `invalid-env-not-set`. Se contiver, em **Vercel → Project → Settings → Environment Variables** tens de ter `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Production**, **Save**, e **Redeploy** (rebuild).

## Notas

- **Realtime (WebSocket)** não passa por este proxy; este projecto usa sobretudo REST + Auth.
- **Chave anon** continua a ir no browser (como hoje); o proxy não substitui o modelo de segurança do Supabase.
- Se no futuro precisares de ajustar CORS, edita `handleOptions` / `CORS_HEADERS_FALLBACK` em `src/index.ts`.
