import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentV1,
} from '../lib/cookieConsent';
import { useCart } from '../store/cartStore';

type CookieConsentContextValue = {
  consent: CookieConsentV1 | null;
  /** Bannière tant qu’aucun choix enregistré */
  showBanner: boolean;
  /** Panneau « personnaliser » */
  showCustomize: boolean;
  setShowCustomize: (v: boolean) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveCustom: (functional: boolean, analytics: boolean) => void;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function nowIso(): string {
  return new Date().toISOString();
}

function clearCartIfNeeded(functional: boolean) {
  if (functional) return;
  try {
    useCart.persist.clearStorage();
  } catch {
    /* noop */
  }
  useCart.getState().clearCart();
}

function rehydrateCart() {
  try {
    const r = useCart.persist.rehydrate();
    if (r && typeof (r as Promise<void>).then === 'function') void (r as Promise<void>).catch(() => {});
  } catch {
    /* noop */
  }
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentV1 | null>(() =>
    typeof window !== 'undefined' ? readCookieConsent() : null
  );
  const [showCustomize, setShowCustomize] = useState(false);

  const showBanner = consent == null || !consent.decided;

  const persistAndApply = useCallback((next: CookieConsentV1) => {
    writeCookieConsent(next);
    setConsent(next);
    clearCartIfNeeded(next.functional);
    if (next.functional) rehydrateCart();
  }, []);

  const acceptAll = useCallback(() => {
    persistAndApply({
      v: 1,
      decided: true,
      functional: true,
      analytics: true,
      updatedAt: nowIso(),
    });
    setShowCustomize(false);
  }, [persistAndApply]);

  const rejectOptional = useCallback(() => {
    persistAndApply({
      v: 1,
      decided: true,
      functional: false,
      analytics: false,
      updatedAt: nowIso(),
    });
    setShowCustomize(false);
  }, [persistAndApply]);

  const saveCustom = useCallback(
    (functional: boolean, analytics: boolean) => {
      persistAndApply({
        v: 1,
        decided: true,
        functional,
        analytics,
        updatedAt: nowIso(),
      });
      setShowCustomize(false);
    },
    [persistAndApply]
  );

  const openPreferences = useCallback(() => {
    setShowCustomize(true);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setShowCustomize(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      showBanner,
      showCustomize,
      setShowCustomize,
      acceptAll,
      rejectOptional,
      saveCustom,
      openPreferences,
    }),
    [
      consent,
      showBanner,
      showCustomize,
      acceptAll,
      rejectOptional,
      saveCustom,
      openPreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
