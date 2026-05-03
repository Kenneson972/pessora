// src/hooks/useBarSettings.ts
// Lecture/écriture de la configuration globale du bar (adresse, horaires, contact).
// Source : table `bar_settings` (single-row id=1). Lecture publique, update admin-only via RLS.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type {
  BarAddress,
  BarContact,
  BarHours,
  BarSettings,
  BarSubscriptionInfo,
} from '../types/database';
import { formatSupabaseDataError, formatMutationError } from '../lib/userFacingError';

const DEFAULT_SETTINGS: BarSettings = {
  id: 1,
  address: {
    street: '',
    city: '',
    postal_code: '',
    country: '',
    full: '',
    maps_url: '',
  },
  hours: [],
  contact: {
    email: '',
    phone: '',
    instagram: '',
    instagram_url: '',
  },
  subscription_info: {},
  updated_at: new Date().toISOString(),
};

export function useBarSettings() {
  const [settings, setSettings] = useState<BarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: fetchError } = await (supabase as any)
      .from('bar_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (fetchError) {
      setError(formatSupabaseDataError(fetchError.message, 'generic'));
      setSettings(DEFAULT_SETTINGS);
    } else {
      setSettings((data as BarSettings | null) ?? DEFAULT_SETTINGS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Pick<BarSettings, 'address' | 'hours' | 'contact' | 'subscription_info'>>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: updateError } = await (supabase as any)
        .from('bar_settings')
        .update(patch)
        .eq('id', 1)
        .select('*')
        .maybeSingle();

      if (updateError) {
        throw new Error(formatMutationError(updateError.message));
      }
      if (data) setSettings(data as BarSettings);
      return data as BarSettings | null;
    },
    [],
  );

  return { settings, loading, error, reload: load, update };
}

export type { BarAddress, BarContact, BarHours, BarSettings, BarSubscriptionInfo };
