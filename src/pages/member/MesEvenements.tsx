// src/pages/member/MesEvenements.tsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@heroui-pro/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Event } from '../../types/database';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { MemberPageSkeleton } from '../../components/member/MemberPageSkeleton';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';

interface RegistrationWithEvent {
  id: string;
  event_id: string;
  nom: string;
  prenom: string;
  nb_personnes: string;
  created_at: string;
  events: Event;
}

const TYPE_LABELS: Record<Event['type'], string> = {
  run_club: 'Course',
  popup: 'Pop-up',
  atelier: 'Atelier',
  event: 'Événement',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
};

const MesEvenements = () => {
  useEffect(() => { document.title = 'Mes événements — PessÓra'; }, []);
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<RegistrationWithEvent | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadRegistrations = useCallback(() => {
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setFetchError(null);
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: RegistrationWithEvent[] | null; error: { message?: string } | null }) => {
        if (cancelled) return;
        if (error) {
          setFetchError('Impossible de charger vos inscriptions.');
          setRegistrations([]);
        } else {
          setRegistrations(data ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError('Impossible de charger vos inscriptions.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const cleanup = loadRegistrations();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [loadRegistrations]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = registrations.filter(r => r.events?.date >= today);
  const past = registrations.filter(r => r.events?.date < today);

  const confirmCancel = async () => {
    if (!cancelTarget || !user) return;
    setCancelLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('event_registrations')
        .delete()
        .eq('id', cancelTarget.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Suppression impossible');
      setRegistrations((prev) => prev.filter((r) => r.id !== cancelTarget.id));
      setCancelTarget(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Annulation impossible.');
    } finally {
      setCancelLoading(false);
    }
  };

  const EventCard = ({ reg }: { reg: RegistrationWithEvent }) => {
    const ev = reg.events;
    if (!ev) return null;
    const d = new Date(ev.date + 'T00:00:00');
    const isPast = ev.date < today;
    return (
      <div
        className={`flex flex-col rounded-[2px] border transition-colors sm:flex-row sm:flex-wrap sm:items-stretch ${
          isPast ? 'border-noir/[0.04] bg-white opacity-60' : 'border-noir/[0.06] bg-white'
        }`}
      >
        <Link
          to={`/evenements/${ev.slug}`}
          className="group flex flex-1 flex-wrap items-center gap-x-4 gap-y-3 p-5 transition-colors sm:min-w-0"
        >
          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[2px] ${isPast ? 'bg-noir/[0.06]' : 'bg-noir/[0.06]'}`}>
            <span className={`text-[20px] font-normal leading-none ${isPast ? 'text-black/40' : 'text-black/60'}`}>
              {d.getDate()}
            </span>
            <span className={`text-[8px] tracking-[0.12em] uppercase ${isPast ? 'text-black/25' : 'text-black/35'}`}>
              {d.toLocaleDateString('fr-FR', { month: 'short' })}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <p className="truncate text-[13px] font-normal text-black">{ev.title}</p>
              <span className="shrink-0 text-[8px] font-light uppercase tracking-[0.18em] text-black/30">
                {TYPE_LABELS[ev.type]}
              </span>
            </div>
            <p className="text-[10px] font-light text-black/40">
              {[ev.heure?.slice(0, 5), ev.location ?? ev.meeting_point].filter(Boolean).join(' · ')}
            </p>
            {Number(reg.nb_personnes) > 1 && (
              <p className="mt-0.5 text-[9px] font-light text-black/30">{reg.nb_personnes} personnes</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-[2px] px-2.5 py-1 text-[8px] font-normal uppercase tracking-[0.15em] ${
              isPast ? 'bg-noir/5 text-black/30' : 'bg-sapin/8 text-sapin border border-sapin/20'
            }`}
          >
            {isPast ? 'Passé' : 'Confirmé'}
          </span>
        </Link>
        {!isPast && (
          <div className="flex border-t border-noir/[0.06] px-5 py-3 sm:border-l sm:border-t-0 sm:items-center">
            <button
              type="button"
              onClick={() => setCancelTarget(reg)}
              className="min-h-[44px] px-1 text-[10px] font-normal uppercase tracking-[0.12em] text-black/40 underline underline-offset-2 transition-colors hover:text-red-600"
            >
              Annuler l&apos;inscription
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <DashPageHeader
        title="Mes événements"
        subtitle="Vos inscriptions à venir et passées."
        action={
          <Link
            to="/evenements"
            className="inline-flex items-center rounded-full border border-noir/15 px-4 py-[10px] min-h-[44px] text-[13px] font-medium text-black/55 hover:text-noir hover:border-noir/30 transition-colors"
          >
            Tous les événements
          </Link>
        }
      />
      <div className={DASH_MAIN_PAD}>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Annuler l&apos;inscription ?"
        description={
          cancelTarget?.events?.title ? (
            <>Vous êtes inscrit(e) à « {cancelTarget.events.title} ». Cette action est définitive.</>
          ) : (
            'Cette action est définitive.'
          )
        }
        confirmLabel="Annuler l&apos;inscription"
        loadingLabel="Annulation…"
        loading={cancelLoading}
        onClose={() => !cancelLoading && setCancelTarget(null)}
        onConfirm={confirmCancel}
      />

      {fetchError && (
        <p className="mb-4 text-[11px] text-red-600/90" role="alert">
          {fetchError}
        </p>
      )}

      {loading ? (
        <MemberPageSkeleton rows={6} />
      ) : registrations.length === 0 ? (
        <EmptyState className="rounded-[2px] border border-noir/[0.06] bg-white p-12">
          <EmptyState.Header>
            <EmptyState.Title className="text-[13px] font-normal text-black">
              Aucune inscription
            </EmptyState.Title>
            <EmptyState.Description className="text-[11px] font-light text-black/40">
              Tu n&apos;es inscrit(e) à aucun événement pour l&apos;instant.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link
              to="/evenements"
              className="inline-flex min-h-[44px] items-center justify-center bg-noir px-6 rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite transition-colors"
            >
              Voir les événements
            </Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.28em] text-black/35">
                À venir · {upcoming.length}
              </p>
              <div className="flex flex-col gap-2">
                {upcoming.map(r => <EventCard key={r.id} reg={r} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.28em] text-black/35">
                Passés · {past.length}
              </p>
              <div className="flex flex-col gap-2">
                {past.map(r => <EventCard key={r.id} reg={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default MesEvenements;
