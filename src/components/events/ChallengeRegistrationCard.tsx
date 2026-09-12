import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import type { Event } from '../../types/database';
import { PostRegistrationWizard } from './PostRegistrationWizard';
import { BilanBookingWidget } from './BilanBookingWidget';
import { isValidPhone } from '../../lib/phone';
import { formatDateShort } from '../../lib/eventDateFormat';

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().refine(isValidPhone, 'Vérifiez votre numéro de téléphone'),
  nb_personnes: z.string(),
  souhait_info: z.string(),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter le traitement de vos données pour vous inscrire.',
  }),
});

type FormData = z.infer<typeof schema>;

const NB_OPTIONS = [
  { value: 'Je viens seul', label: 'Je viens seul(e)' },
  { value: '+1 personne', label: '+1 personne' },
  { value: '+2 personnes', label: '+2 personnes' },
  { value: '+3 personnes ou plus', label: '+3 personnes ou plus' },
];

const INFO_OPTIONS = [
  { value: 'Oui avec plaisir', label: 'Oui avec plaisir' },
  { value: 'Non merci', label: 'Non merci' },
];

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-4 text-[14px] text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

export interface ChallengeRegistrationCardProps {
  event: Event & { registrationCount: number };
}

export function ChallengeRegistrationCard({ event }: ChallengeRegistrationCardProps) {
  const { user } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');
  const [postRegistration, setPostRegistration] = useState<{ id: string; telephone: string } | null>(null);
  const [registrationCount, setRegistrationCount] = useState(event.registrationCount);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      nb_personnes: 'Je viens seul',
      souhait_info: 'Non merci',
      privacyAccepted: false,
    },
  });

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
        nb_personnes: data.nb_personnes,
        souhait_info: data.souhait_info,
      });

    if (error) {
      setSubmitStatus(error.code === '23505' ? 'duplicate' : 'error');
      return;
    }

    setPostRegistration({ id: registrationId, telephone: data.telephone });
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
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
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
            <BilanBookingWidget challengeEventId={event.id} />
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
                <label htmlFor="prenom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Prénom *</label>
                <input id="prenom" {...field} placeholder="Jean" className={inputClass} />
                {errors.prenom?.message && <p className="text-[11px] text-red-600">{errors.prenom.message}</p>}
              </div>
            )} />
            <Controller name="nom" control={control} render={({ field }) => (
              <div className="space-y-1">
                <label htmlFor="nom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Nom *</label>
                <input id="nom" {...field} placeholder="Dupont" className={inputClass} />
                {errors.nom?.message && <p className="text-[11px] text-red-600">{errors.nom.message}</p>}
              </div>
            )} />
          </div>

          <Controller name="telephone" control={control} render={({ field }) => (
            <div className="space-y-1">
              <label htmlFor="telephone" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                Téléphone * <span className="normal-case text-black/25">(WhatsApp de préférence)</span>
              </label>
              <input id="telephone" {...field} type="tel" placeholder="0696 XX XX XX" className={inputClass} />
              {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
            </div>
          )} />

          <Controller name="nb_personnes" control={control} render={({ field }) => (
            <div className="space-y-1">
              <label htmlFor="nb_personnes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                Combien de personnes ?
              </label>
              <select
                id="nb_personnes"
                {...field}
                className="w-full border-0 border-b border-noir/10 bg-transparent py-4 text-[14px] text-noir focus:outline-none focus:border-noir transition-colors"
              >
                {NB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )} />

          <div className="space-y-3">
            <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40">
              Souhaites-tu rester informé(e) des prochains événements ?
            </p>
            <Controller name="souhait_info" control={control} render={({ field }) => (
              <div className="space-y-2" role="radiogroup" aria-label="Souhait d'information">
                {INFO_OPTIONS.map(o => (
                  <label key={o.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="souhait_info"
                      value={o.value}
                      checked={field.value === o.value}
                      onChange={() => field.onChange(o.value)}
                      className="accent-sapin"
                    />
                    <span className="text-[13px] text-black/60 group-hover:text-noir transition-colors">{o.label}</span>
                  </label>
                ))}
              </div>
            )} />
          </div>

          <Controller
            name="privacyAccepted"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label htmlFor="event-privacy-accepted" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="event-privacy-accepted"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-sapin"
                  />
                  <span className="text-[11px] font-light leading-relaxed text-black/55">
                    J’accepte que mes données (nom, prénom, téléphone) soient utilisées pour gérer mon inscription
                    et me contacter concernant cet événement, conformément à la{' '}
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
            {isSubmitting ? 'Inscription en cours…' : (event.is_free ? "Je m'inscris gratuitement" : `Je m'inscris — ${event.price?.toLocaleString('fr-FR', {minimumFractionDigits: 2})}€`)}
          </button>
        </form>
      )}
    </div>
  );
}
