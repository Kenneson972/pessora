// CORS helper partagé — autorise les hostnames configurés (liste séparée par
// virgules dans ALLOWED_ORIGIN, ex: "https://www.pessora.fr,https://admin.pessora.fr")
// ET localhost (dev).
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const rawAllowed = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.pessora.fr";
  const allowedOrigins = rawAllowed.split(',').map((o) => o.trim()).filter(Boolean);
  const isLocalhost = origin != null &&
    (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  const isAllowedOrigin = origin != null && allowedOrigins.includes(origin);
  return {
    'Access-Control-Allow-Origin': isLocalhost || isAllowedOrigin ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
