/** Stockage local du choix cookies (hors cookies HTTP serveur). */
export const COOKIE_CONSENT_STORAGE_KEY = 'pessora-cookie-consent-v1';

export type CookieConsentV1 = {
  v: 1;
  /** Choix enregistré (ferme la bannière) */
  decided: boolean;
  /** Panier mémorisé sur l’appareil, préférences d’affichage locales liées au confort d’usage */
  functional: boolean;
  /** Futurs outils de mesure d’audience (Matomo, Plausible, etc.) — actuellement non chargés */
  analytics: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsentV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as CookieConsentV1;
    if (p.v !== 1 || typeof p.decided !== 'boolean') return null;
    return p;
  } catch {
    return null;
  }
}

export function writeCookieConsent(c: CookieConsentV1): void {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(c));
}

/**
 * Tant qu’aucun choix explicite : on ne bloque pas le panier (comportement existant).
 * Après « tout refuser » (hors nécessaire) : `functional === false` → pas de persistance panier.
 */
export function allowCartPersistence(): boolean {
  const c = readCookieConsent();
  if (c == null) return true;
  if (!c.decided) return true;
  return c.functional;
}

export const COOKIE_PREFERENCES_EVENT = 'pessora-open-cookie-preferences';

export function dispatchOpenCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT));
}
