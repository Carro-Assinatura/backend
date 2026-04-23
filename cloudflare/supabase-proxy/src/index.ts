/**
 * Proxy reverso para o API do Supabase num domínio teu (ex.: *.workers.dev).
 * Ajuda quando operadoras não resolvem bem *.supabase.co em DNS.
 *
 * Secret: SUPABASE_HOST = ref do projeto, ex. abcxyz.supabase.co (sem https://)
 */

export interface Env {
  SUPABASE_HOST: string;
}

const CORS_METHODS = "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS_FALLBACK =
  "authorization,apikey,content-type,prefer,x-client-info,x-supabase-api-version,accept-profile,content-profile,range,accept,x-upsert";

function stripUpstreamCors(h: Headers): void {
  const keys = [...h.keys()].filter((k) => k.toLowerCase().startsWith("access-control-"));
  for (const k of keys) h.delete(k);
}

/** CORS simples: * + sem credentials (o SDK usa Bearer no header, não cookies cross-origin). */
function withCors(res: Response): Response {
  const h = new Headers(res.headers);
  stripUpstreamCors(h);
  h.set("Access-Control-Allow-Origin", "*");
  const ex = res.headers.get("Access-Control-Expose-Headers");
  h.set("Access-Control-Expose-Headers", ex ?? "content-range");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function handleOptions(request: Request): Response {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", CORS_METHODS);
  const reqHdr = request.headers.get("Access-Control-Request-Headers");
  h.set(
    "Access-Control-Allow-Headers",
    reqHdr?.trim() ? reqHdr.trim() : CORS_HEADERS_FALLBACK,
  );
  h.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers: h });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const host = String(env.SUPABASE_HOST ?? "").trim().toLowerCase();
    if (!host || host.includes("/") || !host.endsWith(".supabase.co")) {
      return new Response("Configure o secret SUPABASE_HOST (ex.: ref.supabase.co)", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (request.method === "OPTIONS") return handleOptions(request);

    const incoming = new URL(request.url);
    incoming.protocol = "https:";
    incoming.hostname = host;
    incoming.port = "";

    const headers = new Headers(request.headers);
    headers.set("Host", host);

    const upstream = await fetch(incoming.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    return withCors(upstream);
  },
};
