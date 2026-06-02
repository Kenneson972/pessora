// CORS helper partagé — autorise le hostname configuré ET localhost (dev)
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.pessora.mq";
  const isLocalhost = origin != null &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  return {
    'Access-Control-Allow-Origin': isLocalhost ? origin : allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
