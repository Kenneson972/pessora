import { useEffect, useState, useMemo, useCallback } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  DashCard, DashEyebrow, DashPageHeader,
} from '../../components/dashboard/primitives';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

type BilanBooking = {
  id: string;
  slot_id: string | null;
  user_id: string | null;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  date_rdv: string;
  heure_rdv: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  origine: 'visiteur' | 'questionnaire' | 'admin' | null;
  notes: string | null;
  created_at: string;
};

function formatTime(h: string): string {
  return h.slice(0, 5);
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  confirme: { label: 'Confirmé', color: 'text-sapin bg-sapin/8 border border-sapin/20' },
  annule: { label: 'Annulé', color: 'text-gray-500 bg-gray-50 border border-gray-200' },
};

/**
 * Historique + annulation uniquement — la réservation d'un nouveau bilan se
 * fait depuis la page du challenge (BilanBookingWidget), qui pose les
 * garanties serveur (trigger, index unique, dédup). L'ancienne section
 * "Nouveau bilan" de cette page insérait directement dans bilan_bookings et
 * basculait bilan_slots.disponible=false côté client — bloqué silencieusement
 * par la RLS admin-only sur bilan_slots (bug connu, jamais corrigé ici,
 * cf. commentaire de tête de BilanBookingWidget.tsx). Ne pas la réintroduire.
 */
const MesBilans = () => {
  useEffect(() => { document.title = 'Mes bilans — PessÓra'; }, []);
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BilanBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  // L'erreur est rattachée à UN rendez-vous (elle s'affiche dans SA carte, pas en
  // haut de page où le membre ne la verrait pas après avoir cliqué plus bas).
  const [cancelError, setCancelError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('bilan_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('date_rdv', { ascending: false })
      .then(({ data }: { data: BilanBooking[] | null }) => {
        if (cancelled) return;
        setBookings(data ?? []);
        setBookingsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelLoading(cancelTarget);
    setCancelError(null);
    // .select('id') est le bon outil ici : c'est la ligne du membre connecté
    // (auth.uid() = user_id), la policy SELECT own s'applique, le RETURNING
    // fonctionne. Ne pas copier ce pattern sur le chemin invité du widget
    // public (BilanBookingWidget.tsx), où le RETURNING casserait l'INSERT.
    const { data, error } = await (supabase as any)
      .from('bilan_bookings')
      .update({ statut: 'annule' })
      .eq('id', cancelTarget)
      .select('id');

    if (error || !data || data.length === 0) {
      setCancelError({
        id: cancelTarget,
        message:
          'Impossible d’annuler ce rendez-vous — rien n’a été annulé. Réessaie dans un instant, ou écris-nous à pessora.mq@gmail.com.',
      });
      setCancelLoading(null);
      setCancelTarget(null);
      return;
    }

    // Succès : on efface une éventuelle erreur précédente. Sinon, sur une
    // deuxième tentative qui réussit, la carte afficherait « annulation
    // impossible » ET « annulé » en même temps.
    setCancelError(null);
    setBookings((prev) => prev.map((b) => (b.id === cancelTarget ? { ...b, statut: 'annule' } : b)));
    setCancelLoading(null);
    setCancelTarget(null);
  }, [cancelTarget]);

  const handleCancelClick = (bookingId: string) => {
    setCancelError(null);
    setCancelTarget(bookingId);
  };

  const handleCancelClose = useCallback(() => {
    if (!cancelLoading) setCancelTarget(null);
  }, [cancelLoading]);

  const confirmedCount = useMemo(() => bookings.filter((b) => b.statut === 'confirme').length, [bookings]);
  const pendingCount = useMemo(() => bookings.filter((b) => b.statut === 'en_attente').length, [bookings]);

  return (
    <>
      <div>
        <DashPageHeader
          breadcrumb="Bilan personnalisé"
          title="Mes bilans bien-être"
          subtitle="Suis tes rendez-vous et demandes de bilan."
        />

        <div className={DASH_MAIN_PAD}>
          <div className="mb-8 flex flex-wrap gap-4">
            <DashCard className="flex flex-col gap-2 min-w-[140px]">
              <DashEyebrow>Confirmés</DashEyebrow>
              <span className="font-display text-[28px] leading-none">{confirmedCount}</span>
            </DashCard>
            <DashCard className="flex flex-col gap-2 min-w-[140px]">
              <DashEyebrow>En attente</DashEyebrow>
              <span className="font-display text-[28px] leading-none">{pendingCount}</span>
            </DashCard>
          </div>

          <DashCard>
            <div className="mb-4 flex items-center justify-between">
              <DashEyebrow>Historique</DashEyebrow>
              <Link
                to="/evenements"
                className="inline-flex items-center gap-1.5 text-[11px] text-noir/60 hover:text-noir transition-colors underline underline-offset-2"
              >
                Réserver un bilan <ArrowRight size={12} />
              </Link>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-10" role="status">
                <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays size={32} strokeWidth={1} className="mx-auto text-black/25 mb-4" aria-hidden="true" />
                <p className="text-[13px] text-black/45">
                  Aucun bilan pour le moment.
                </p>
                <p className="text-[12px] text-black/30 mt-1">
                  Inscris-toi à un challenge pour réserver ton bilan offert.
                </p>
              </div>
            ) : (
              <div>
                {bookings.map((b, i) => {
                  const sm = STATUS_META[b.statut] ?? { label: b.statut, color: 'text-black/40' };
                  const d = new Date(b.date_rdv + 'T00:00:00');
                  const day = String(d.getDate());
                  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
                  return (
                    <div
                      key={b.id}
                      className={`py-4 ${i > 0 ? 'border-t border-noir/[0.06]' : ''}`}
                    >
                      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1">
                      <div className="w-[48px] h-[48px] rounded-[10px] bg-surface-muted border border-noir/[0.06] flex flex-col items-center justify-center shrink-0">
                        <span className="font-display text-[15px] leading-none">{day}</span>
                        <span className="text-[8px] tracking-[0.14em] text-black/40 mt-[1px]">{month}</span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[13px] font-medium leading-snug">
                          {b.slot_id ? 'Bilan bien-être' : 'Demande de bilan (hors créneau)'}
                        </p>
                        <p className="text-[11.5px] text-black/45 mt-0.5">
                          {b.slot_id ? formatTime(b.heure_rdv) : 'En attente de proposition'}
                          {b.notes ? ` · "${b.notes.slice(0, 40)}${b.notes.length > 40 ? '…' : ''}"` : ''}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center rounded-full px-[8px] py-[3px] text-[9px] uppercase tracking-[0.14em] font-medium ${sm.color}`}>
                          {sm.label}
                        </span>
                        {b.statut === 'en_attente' && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(b.id)}
                            disabled={cancelLoading === b.id}
                            className="text-[12px] text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors disabled:opacity-40"
                          >
                            {cancelLoading === b.id ? 'Annulation…' : 'Annuler'}
                          </button>
                        )}
                      </div>
                      </div>

                      {cancelError?.id === b.id && (
                        <p className="mt-3 pl-0 text-[13px] leading-snug text-red-600 sm:pl-16" role="alert">
                          {cancelError.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DashCard>
        </div>
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Annuler ce rendez-vous ?"
        description="Tu pourras en réserver un nouveau à tout moment depuis la page du challenge."
        confirmLabel="Annuler le rendez-vous"
        cancelLabel="Retour"
        loadingLabel="Annulation…"
        loading={cancelLoading !== null}
        onConfirm={handleCancelConfirm}
        onClose={handleCancelClose}
      />
    </>
  );
};

export default MesBilans;
