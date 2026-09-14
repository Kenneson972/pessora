import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Event } from '../../types/database';
import { PostRegistrationWizard } from './PostRegistrationWizard';
import { BilanBookingWidget } from './BilanBookingWidget';
import { isValidPhone } from '../../lib/phone';
import { formatDateShort } from '../../lib/eventDateFormat';

// Formulaire dédié Challenge 21 jours — reprend les questions de la fiche papier de Catherine
// (docs/fiche-papier-challenge-21j.md), décision @user du 14/09 : il DOIT différer du formulaire
// générique des 6 autres types d'événement (ChallengeRegistrationCard.tsx, non touché).
// Détail : docs/BRIEF-FORMULAIRE-CHALLENGE-2026-09-14.md

const AGE_NON_RENSEIGNE = 'non_renseigne';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().refine(isValidPhone, 'Vérifiez votre numéro de téléphone'),
  age: z.string(), // chiffres, chaîne vide (facultatif) ou AGE_NON_RENSEIGNE
  profession: z.string(),
  timing_demarrage: z.string().min(1, 'Choisis une réponse'),
  creneau_rappel: z.array(z.string()),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter le traitement de vos données pour vous inscrire.',
  }),
});

type FormData = z.infer<typeof schema>;

// Les 3 timings de la fiche — remplacent l'ancien souhait_info (« Souhaites-tu rester informé ? »),
// absurde pour un challenge individuel.
const TIMING_OPTIONS = [
  { value: 'ce_mois_ci', label: 'Ce mois-ci' },
  { value: 'mois_prochain', label: 'Le mois prochain' },
  { value: 'en_savoir_plus', label: 'Je souhaite en savoir plus' },
];

// Les 4 créneaux de rappel de la fiche — ☐ multiples sur le papier, donc cases à cocher ici.
const CRENEAU_OPTIONS = [
  { value: 'matin', label: 'Matin' },
  { value: 'midi', label: 'Midi' },
  { value: 'apres_midi', label: 'Après-midi' },
  { value: 'soir', label: 'Soir' },
];

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-4 text-[14px] text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

const labelClass = 'text-[9px] font-normal uppercase tracking-[0.2em] text-black/60 block';

type Metier = { label: string; rome: string; src: 'fiche' | 'principale' | 'synonyme' };

// Poids par source : fiche/principale d'abord (les vrais métiers), synonyme en secours —
// sinon taper « maçon » renvoie 30 propositions et décourage au lieu d'aider.
const SRC_RANK: Record<Metier['src'], number> = { fiche: 0, principale: 0, synonyme: 1 };
const METIERS_MAX_RESULTS = 8;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Rang de pertinence pour une requête : le libellé COMMENCE par la requête (0), un de ses MOTS
 * commence par elle (1), ou elle apparaît seulement en sous-chaîne (2). Sans ce classement, « med »
 * renvoie n'importe quel métier contenant « média »/« médic » avant « Médecin » — inutilisable.
 */
function matchRank(label: string, query: string): number {
  const n = normalize(label);
  if (n.startsWith(query)) return 0;
  if (n.split(/[^a-z0-9]+/).some((w) => w.startsWith(query))) return 1;
  return 2;
}

/** Hook léger : charge le dictionnaire de métiers À LA DEMANDE (1er focus), jamais au bundle initial. */
function useMetierSuggestions() {
  const [metiers, setMetiers] = useState<Metier[] | null>(null);
  const loadingRef = useRef(false);

  const ensureLoaded = () => {
    if (metiers || loadingRef.current) return;
    loadingRef.current = true;
    fetch('/data/metiers-rome.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Metier[]) => setMetiers(Array.isArray(data) ? data : []))
      .catch(() => setMetiers([]))
      .finally(() => {
        loadingRef.current = false;
      });
  };

  const suggest = (query: string): Metier[] => {
    const q = normalize(query.trim());
    if (!metiers || q.length < 2) return [];
    const matches = metiers.filter((m) => normalize(m.label).includes(q));
    matches.sort(
      (a, b) =>
        matchRank(a.label, q) - matchRank(b.label, q) ||
        SRC_RANK[a.src] - SRC_RANK[b.src] ||
        a.label.localeCompare(b.label, 'fr'),
    );
    return matches.slice(0, METIERS_MAX_RESULTS);
  };

  return { ensureLoaded, suggest, isReady: metiers !== null };
}

export interface Challenge21jRegistrationCardProps {
  event: Event & { registrationCount: number };
}

export function Challenge21jRegistrationCard({ event }: Challenge21jRegistrationCardProps) {
  const { user } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');
  const [postRegistration, setPostRegistration] = useState<{ id: string; nom: string; prenom: string; telephone: string } | null>(null);
  const [registrationCount, setRegistrationCount] = useState(event.registrationCount);
  const [ageDeclined, setAgeDeclined] = useState(false);
  const [professionOpen, setProfessionOpen] = useState(false);
  const { ensureLoaded, suggest } = useMetierSuggestions();

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      age: '',
      profession: '',
      timing_demarrage: '',
      creneau_rappel: [],
      privacyAccepted: false,
    },
  });

  const professionValue = watch('profession');
  const suggestions = useMemo(() => suggest(professionValue ?? ''), [professionValue, suggest]);

  const placesDispo = event.places_max ? event.places_max - registrationCount : null;
  const isFull = placesDispo !== null && placesDispo <= 0;

  const onSubmit = async (data: FormData) => {
    if (event.registration_open === false) {
      setSubmitStatus('error');
      return;
    }
    if (event.places_max && registrationCount >= event.places_max) {
      setSubmitStatus('full');
      return;
    }

    const registrationId = crypto.randomUUID();
    const { error } = await supabase
      .from('event_registrations')
      .insert({
        id: registrationId,
        event_id: event.id,
        user_id: user?.id ?? null,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        age: ageDeclined ? AGE_NON_RENSEIGNE : (data.age.trim() || null),
        profession: data.profession.trim() || null,
        timing_demarrage: data.timing_demarrage,
        creneau_rappel: data.creneau_rappel.length > 0 ? data.creneau_rappel : null,
      });

    if (error) {
      setSubmitStatus(error.code === '23505' ? 'duplicate' : 'error');
      return;
    }

    setPostRegistration({ id: registrationId, nom: data.nom, prenom: data.prenom, telephone: data.telephone });
    setSubmitStatus('success');
    setRegistrationCount((prev) => prev + 1);
  };

  return (
    <div className="bg-white rounded-[2px] p-5 sm:p-8 md:p-10 border border-noir/[0.06]" id="inscription">
      <h2
        className="font-display font-light text-noir mb-8"
        style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}
      >
        {submitStatus === 'success' ? 'Inscription confirmée !' : "Je m'inscris"}
      </h2>

      {submitStatus === 'success' && (
        <div className="w-full">
          <div aria-live="polite" className="flex flex-col items-center text-center gap-4 py-8">
            <CheckCircle size={48} strokeWidth={1} className="text-gold-dim" aria-hidden="true" />
            <p className="text-[13px] text-black/60">
              Tu es inscrit(e) au <strong className="text-noir">{event.title}</strong>.
            </p>
            <p className="text-[12px] text-black/40">
              RDV le{' '}
              <span className="capitalize">{formatDateShort(event.date)}</span>
              {event.heure && <> à {event.heure.slice(0, 5)}</>}.
            </p>
          </div>
          {Array.isArray(event.gallery) && event.gallery.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/60">
                Avant / après — challengers précédents
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.gallery.map((url: string) => (
                  <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <BilanBookingWidget
              challengeEventId={event.id}
              prefill={postRegistration ? { nom: postRegistration.nom, prenom: postRegistration.prenom, telephone: postRegistration.telephone } : undefined}
            />
          </div>

          {postRegistration && (
            <PostRegistrationWizard
              registrationId={postRegistration.id}
              telephone={postRegistration.telephone}
              eventType={event.type}
              eventTitle={event.title}
            />
          )}
        </div>
      )}

      {submitStatus === 'duplicate' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-orange-200/80 bg-orange-50/90 p-4 text-[12px] text-orange-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Ce numéro est déjà inscrit à cet événement. Tu es déjà dans la liste !
        </div>
      )}

      {submitStatus === 'full' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Cet événement est complet. Suis-nous sur Instagram pour les prochaines dates.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
        </div>
      )}

      {event.registration_open === false ? (
        <div className="text-center py-8">
          <p className="text-[13px] font-normal text-black mb-2">Inscriptions fermées</p>
          <p className="text-[11px] font-light text-black/40">
            Les inscriptions pour cet événement ne sont plus disponibles.
          </p>
        </div>
      ) : submitStatus !== 'success' && !isFull && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller name="prenom" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="prenom" className={labelClass}>Prénom *</label>
                <input id="prenom" {...field} placeholder="Jean" className={inputClass} />
                {errors.prenom?.message && <p className="text-[11px] text-red-600">{errors.prenom.message}</p>}
              </div>
            )} />
            <Controller name="nom" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="nom" className={labelClass}>Nom *</label>
                <input id="nom" {...field} placeholder="Dupont" className={inputClass} />
                {errors.nom?.message && <p className="text-[11px] text-red-600">{errors.nom.message}</p>}
              </div>
            )} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller name="telephone" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="telephone" className={labelClass}>
                  Téléphone * <span className="normal-case text-black/60">(WhatsApp de préférence)</span>
                </label>
                <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
                {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
              </div>
            )} />

            <Controller name="age" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="age" className={labelClass}>Âge</label>
                <input
                  id="age"
                  {...field}
                  type="text"
                  inputMode="numeric"
                  disabled={ageDeclined}
                  placeholder="Facultatif"
                  className={`${inputClass} ${ageDeclined ? 'opacity-40' : ''}`}
                />
                <label className="mt-1 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageDeclined}
                    onChange={(e) => {
                      setAgeDeclined(e.target.checked);
                      if (e.target.checked) setValue('age', '');
                    }}
                    className="h-3.5 w-3.5 rounded-[2px] border border-noir/15 accent-sapin"
                  />
                  <span className="text-[11px] font-light text-black/60">Je ne veux pas renseigner</span>
                </label>
              </div>
            )} />
          </div>

          <Controller name="profession" control={control} render={({ field }) => (
            <div className="relative space-y-1">
              <label htmlFor="profession" className={labelClass}>Que fais-tu dans la vie ?</label>
              <input
                id="profession"
                {...field}
                autoComplete="off"
                placeholder="Ex. infirmière, chauffeur, prof de danse…"
                className={inputClass}
                onFocus={() => {
                  ensureLoaded();
                  setProfessionOpen(true);
                }}
                onBlur={() => {
                  field.onBlur();
                  // Laisse le temps au clic sur une suggestion de se déclencher.
                  window.setTimeout(() => setProfessionOpen(false), 120);
                }}
              />
              {professionOpen && suggestions.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Suggestions de métier"
                  className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-[2px] border border-noir/10 bg-white shadow-lg"
                >
                  {suggestions.map((m) => (
                    <li key={`${m.rome}-${m.label}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="block w-full px-4 py-2.5 text-left text-[13px] text-black/70 hover:bg-noir/[0.04]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setValue('profession', m.label, { shouldDirty: true });
                          setProfessionOpen(false);
                        }}
                      >
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )} />

          <div className="space-y-3">
            <p className={labelClass}>Quand souhaites-tu commencer ? *</p>
            <Controller name="timing_demarrage" control={control} render={({ field }) => (
              <div className="space-y-2" role="radiogroup" aria-label="Quand souhaites-tu commencer ?">
                {TIMING_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="timing_demarrage"
                      value={o.value}
                      checked={field.value === o.value}
                      onChange={() => field.onChange(o.value)}
                      className="accent-sapin"
                    />
                    <span className="text-[13px] text-black/70 group-hover:text-noir transition-colors">{o.label}</span>
                  </label>
                ))}
              </div>
            )} />
            {errors.timing_demarrage?.message && <p className="text-[11px] text-red-600">{errors.timing_demarrage.message}</p>}
          </div>

          <div className="space-y-3">
            <p className={labelClass}>Quand peut-on te recontacter ?</p>
            <Controller name="creneau_rappel" control={control} render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {CRENEAU_OPTIONS.map((o) => {
                  const checked = field.value.includes(o.value);
                  return (
                    <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, o.value]
                              : field.value.filter((v) => v !== o.value),
                          );
                        }}
                        className="h-4 w-4 rounded-[2px] border border-noir/15 accent-sapin"
                      />
                      <span className="text-[13px] text-black/70 group-hover:text-noir transition-colors">{o.label}</span>
                    </label>
                  );
                })}
              </div>
            )} />
          </div>

          <Controller
            name="privacyAccepted"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label htmlFor="challenge21j-privacy-accepted" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="challenge21j-privacy-accepted"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-sapin"
                  />
                  <span className="text-[11px] font-light leading-relaxed text-black/60">
                    J’accepte que mes données soient utilisées pour gérer mon inscription au Challenge 21 jours
                    et me recontacter à ce sujet, conformément à la{' '}
                    <Link
                      to="/politique-confidentialite"
                      className="text-black/70 underline decoration-black/30 underline-offset-2 hover:opacity-80"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                {errors.privacyAccepted?.message && (
                  <p className="text-[11px] text-red-600">{errors.privacyAccepted.message}</p>
                )}
              </div>
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-noir text-white py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[11px] hover:bg-anthracite transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Inscription en cours…' : "Je m'inscris au Challenge 21 jours"}
          </button>
        </form>
      )}
    </div>
  );
}
