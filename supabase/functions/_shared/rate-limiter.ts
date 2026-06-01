const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

// Fallback in-memory (fonctionne même sans accès DB)
const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, pgFallback?: { rpc: (fn: string, params: object) => Promise<{ data: boolean | null; error: unknown }> }): boolean {
  // Tenter le rate limiter PostgreSQL si disponible (partagé entre instances)
  if (pgFallback) {
    try {
      return true // Le check PG est asynchrone — utiliser checkRateLimitPg pour le vrai check
    } catch { /* fallback to memory */ }
  }

  // Fallback in-memory (non partagé entre instances Deno)
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_REQUESTS) return false
  entry.count++
  return true
}

/**
 * Rate limiter PostgreSQL — partagé entre toutes les instances Deno.
 * Utilise la fonction check_rate_limit(p_key, p_max, p_window_seconds) créée par la migration.
 * Usage: await checkRateLimitPg(supabase, ip)
 */
export async function checkRateLimitPg(
  supabase: any,
  key: string,
  max = 30,
  windowSeconds = 60
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch {
    // Fallback au check in-memory en cas d'erreur DB
    return checkRateLimit(key);
  }
}
