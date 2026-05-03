import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

/** Même motif que `useAdminMembers` : `Database` ne remplit pas `GenericSchema` (postgrest-js v2). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const DEBOUNCE_MS = 650;

/**
 * État admin (filtres, recherche) : localStorage immédiat + sync Supabase (`profiles.admin_ui_prefs`)
 * pour les comptes admin (clé logique = `key`, ex. `members_filters_v1`).
 */
export function usePersistentAdminState<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
): [T, (patch: Partial<T> | ((prev: T) => T)) => void] {
  const storageKey = `pessora_admin_${key}`;
  const { user, isAdmin, isLoading } = useAuth();
  const [readyToPersist, setReadyToPersist] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<T>;
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });

  // Hydratation serveur (admin) : fusion defaults < local < bloc serveur pour la clé
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setReadyToPersist(true);
      return;
    }
    if (!isAdmin) {
      setReadyToPersist(true);
      return;
    }
    const uid = user.id;
    setReadyToPersist(false);
    let cancelled = false;
    void (async () => {
      const { data, error } = await db
        .from('profiles')
        .select('admin_ui_prefs')
        .eq('id', uid)
        .single();
      if (cancelled) return;
      if (error) {
        setReadyToPersist(true);
        return;
      }
      const block = (data?.admin_ui_prefs as Record<string, unknown> | null)?.[key];
      if (block && typeof block === 'object' && !Array.isArray(block)) {
        setState((prev) => ({ ...defaults, ...prev, ...(block as Partial<T>) }));
      }
      setReadyToPersist(true);
    })();
    return () => {
      cancelled = true;
    };
    // defaults : objet stable par page (ne pas mettre en deps pour éviter re-fetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults v1 par hook
  }, [isLoading, isAdmin, user?.id, key]);

  useEffect(() => {
    if (!readyToPersist) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* quota */
    }
    if (!isAdmin || !user?.id) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        const uid = user.id;
        const { data: row, error: fetchErr } = await db
          .from('profiles')
          .select('admin_ui_prefs')
          .eq('id', uid)
          .single();
        if (fetchErr) return;
        const merged = {
          ...((row?.admin_ui_prefs as Record<string, unknown> | null) ?? {}),
          [key]: state,
        };
        await db.from('profiles').update({ admin_ui_prefs: merged }).eq('id', uid);
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, readyToPersist, isAdmin, user?.id, storageKey, key]);

  const patch = useCallback((u: Partial<T> | ((prev: T) => T)) => {
    setState((prev) => (typeof u === 'function' ? u(prev) : { ...prev, ...u }));
  }, []);

  return [state, patch];
}
