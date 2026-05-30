import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BarStatus {
  isOpen: boolean;
  estimatedWaitMinutes: number;
  loading: boolean;
}

const BarStatusContext = createContext<BarStatus>({ isOpen: true, estimatedWaitMinutes: 5, loading: true });

export function useBarStatus() {
  return useContext(BarStatusContext);
}

export function BarStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BarStatus>({ isOpen: true, estimatedWaitMinutes: 5, loading: true });

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Fetch initial
    db.from('bar_status').select('*').eq('id', 1).single().then(({ data }: { data: { is_open: boolean; estimated_wait_minutes: number } | null }) => {
      if (cancelled || !data) return;
      setStatus({ isOpen: data.is_open, estimatedWaitMinutes: data.estimated_wait_minutes, loading: false });
    });

    // Realtime
    const channel = supabase
      .channel('bar-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bar_status', filter: 'id=eq.1' },
        (payload: { new: { is_open: boolean; estimated_wait_minutes: number } }) => {
          setStatus({ isOpen: payload.new.is_open, estimatedWaitMinutes: payload.new.estimated_wait_minutes, loading: false });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <BarStatusContext.Provider value={status}>
      {children}
    </BarStatusContext.Provider>
  );
}
