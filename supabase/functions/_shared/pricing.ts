// supabase/functions/_shared/pricing.ts
//
// Logique de prix pure, sans API Deno — source unique importée par la fonction
// edge (create-checkout-session) ET par le front (src/data/menuData.ts) ET par
// Vitest (src/__tests__/checkout.test.ts). Ne jamais réimplémenter ces valeurs
// ailleurs : une copie locale finit par diverger silencieusement du serveur.

/** Prix unitaire d'un booster (€), toutes boissons. */
export const BOOSTER_PRICE_EUR = 2;
