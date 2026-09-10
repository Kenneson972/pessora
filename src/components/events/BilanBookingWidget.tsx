import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { isValidPhone } from '../../lib/phone';
import { mapBilanError } from '../../lib/bilanErrors';

interface Slot {
  id: string;
  date: string;
  heure: string;
}

interface Props {
  challengeEventId: string;
}

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-3 text-[13px] text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

const formatSlotDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

/**
 * Widget de réservation de bilan pour un challenge — remplace
 * BilanBienEtre.tsx / member/MesBilans.tsx (non routés, conservaient un bug
 * connu : bascule `disponible=false` côté client, bloquée silencieusement
 * par la RLS admin-only sur bilan_slots). Ici, la garantie vit entièrement
 * côté serveur (RLS + trigger + index unique, migration 20260911100000) —
 * ce widget se contente d'INSERT et affiche la réponse du serveur, jamais
 * de logique de disponibilité côté client.
 *
 * Deux chemins, tous deux acceptés par la garde serveur :
 * - un créneau existant (slot_id renseigné), dans la fenêtre J-14 → J ;
 * - une demande hors-créneau (slot_id NULL), acceptée seulement entre J+1
 *   et J+7 — le serveur le vérifie lui-même, ce widget ne fait que proposer
 *   les deux options et laisser le serveur trancher.
 *
 * ⚠️ Non testable en conditions réelles tant que la migration
 * 20260911100000 n'est pas appliquée (pas de challenge_event_id en base,
 * pas de contrainte 'challenge' sur events.type).
 *
 * Les 2 insert() ci-dessous n'appellent JAMAIS .select() : avec
 * Prefer: return=representation (ce que .select() ajoute), PostgREST
 * exige que la ligne insérée soit relisible par une policy SELECT de
 * l'appelant — hors une réservation invité a user_id=NULL, et la seule
 * policy SELECT sur bilan_bookings est "Users read own bookings"
 * (auth.uid()=user_id), jamais vraie pour NULL=NULL. Vérifié en direct
 * (branche jetable) : le même payload passe en 201 sans .select() et
 * échoue en 401/42501 avec — .select() casserait le chemin invité, qui
 * est le chemin principal (réservation sans compte). error===null (pas
 * de lecture de ligne) est un signal de succès suffisant ici.
 */
export function BilanBookingWidget({ challengeEventId }: Props) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showHorsDate, setShowHorsDate] = useState(false);

  const [nom, setNom] = useState(user?.lastName ?? '');
  const [prenom, setPrenom] = useState(user?.firstName ?? '');
  const [telephone, setTelephone] = useState(user?.phone ?? '');
  const [dateRdv, setDateRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState('');

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'conflict' | 'rate_limited'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    supabase
      .from('bilan_slots')
      .select('id,date,heure')
      .eq('challenge_event_id', challengeEventId)
      .eq('disponible', true)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setSlots(data as Slot[]);
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [challengeEventId]);

  const contactValid = nom.trim().length >= 2 && prenom.trim().length >= 2 && isValidPhone(telephone);

  const submitSlot = async () => {
    if (!selectedSlot || !contactValid) return;
    const slot = slots.find((s) => s.id === selectedSlot);
    if (!slot) return;

    setStatus('submitting');
    setErrorMsg(null);

    const { error } = await supabase.from('bilan_bookings').insert({
      slot_id: selectedSlot,
      user_id: user?.id ?? null,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim(),
      email: user?.email ?? null,
      date_rdv: slot.date,
      heure_rdv: slot.heure,
    });

    if (error) {
      setErrorMsg(mapBilanError(error, 'slot'));
      setStatus(error.code === '23505' ? 'conflict' : 'error');
      if (error.code === '23505') {
        setSlots((prev) => prev.filter((s) => s.id !== selectedSlot));
        setSelectedSlot(null);
      }
      return;
    }

    // Le trigger serveur ferme le créneau (disponible=false) au même
    // moment — l'état local doit refléter ça immédiatement, pas attendre
    // un futur rechargement de la liste.
    setSlots((prev) => prev.filter((s) => s.id !== selectedSlot));
    setStatus('success');
  };

  const submitHorsDate = async () => {
    if (!contactValid || !dateRdv || !heureRdv) return;

    setStatus('submitting');
    setErrorMsg(null);

    const { error } = await supabase.from('bilan_bookings').insert({
      slot_id: null,
      user_id: user?.id ?? null,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim(),
      email: user?.email ?? null,
      date_rdv: dateRdv,
      heure_rdv: heureRdv,
    });

    if (error) {
      setErrorMsg(mapBilanError(error, 'hors-date'));
      setStatus(
        error.code === '23505' || error.code === 'P0002'
          ? 'conflict'
          : error.code === 'P0001'
            ? 'rate_limited'
            : 'error',
      );
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[2px] border border-noir/[0.06] bg-surface-muted p-8 text-center">
        <CheckCircle size={32} strokeWidth={1.25} className="text-sapin" aria-hidden />
        <p className="text-[13px] text-black/70">
          {selectedSlot
            ? 'Ta demande de créneau est envoyée — Catherine te confirme rapidement.'
            : 'Ta demande est envoyée — Catherine te recontacte pour fixer l’heure exacte.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border border-noir/[0.06] bg-surface-muted p-6 md:p-8">
      <h3
        className="mb-2 font-display text-xl font-normal text-black"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Réserve ton bilan
      </h3>
      <p className="mb-6 text-[12px] font-light text-black/50">
        Le bilan est obligatoire pour participer au challenge.
      </p>

      {errorMsg && (
        <p className="mb-4 flex items-start gap-2 rounded-[2px] border border-red-200/80 bg-red-50/90 p-3 text-[12px] text-red-800" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
          {errorMsg}
        </p>
      )}

      {loadingSlots ? (
        <p className="text-[12px] text-black/40">Chargement des créneaux…</p>
      ) : !showHorsDate ? (
        <>
          {slots.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  aria-pressed={selectedSlot === slot.id}
                  className={`rounded-full border px-4 py-2 text-[11px] font-normal uppercase tracking-[0.08em] transition-colors ${
                    selectedSlot === slot.id
                      ? 'border-noir bg-noir text-white'
                      : 'border-noir/15 text-black/55 hover:border-noir/35 hover:text-black'
                  }`}
                >
                  {formatSlotDate(slot.date)} · {slot.heure.slice(0, 5)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mb-6 text-[12px] font-light text-black/50">
              Aucun créneau ouvert pour l’instant.{' '}
              <button type="button" onClick={() => setShowHorsDate(true)} className="text-editorial-link-underline text-black/70 hover:text-black">
                Faire une demande hors créneau
              </button>
              .
            </p>
          )}
        </>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="bilan-date-rdv" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
              Date souhaitée
            </label>
            <input id="bilan-date-rdv" type="date" value={dateRdv} onChange={(e) => setDateRdv(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="bilan-heure-rdv" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
              Heure souhaitée (indicative)
            </label>
            <input id="bilan-heure-rdv" type="time" value={heureRdv} onChange={(e) => setHeureRdv(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="bilan-prenom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Prénom</label>
          <input id="bilan-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="bilan-nom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Nom</label>
          <input id="bilan-nom" value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <label htmlFor="bilan-telephone" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Téléphone</label>
        <input id="bilan-telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputClass} />
      </div>

      <button
        type="button"
        disabled={status === 'submitting' || !contactValid || (showHorsDate ? !dateRdv || !heureRdv : !selectedSlot)}
        onClick={showHorsDate ? submitHorsDate : submitSlot}
        className="mt-6 w-full rounded-full bg-noir py-4 text-[11px] font-normal uppercase tracking-[0.14em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
      >
        {status === 'submitting' ? 'Envoi…' : showHorsDate ? 'Envoyer ma demande' : 'Réserver ce créneau'}
      </button>

      {!showHorsDate && slots.length > 0 && (
        <button
          type="button"
          onClick={() => setShowHorsDate(true)}
          className="mt-3 block text-center text-[10px] font-light text-black/40 hover:text-black/60 underline underline-offset-2"
        >
          Aucun créneau ne convient ? Faire une demande hors créneau
        </button>
      )}
    </div>
  );
}
