import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Activity, Utensils, Sparkles, Target, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { Stepper } from '@heroui-pro/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { BilanSlot } from '../types/database';
import { useStaggerReveal } from '../lib/motionReveal';
import { PageHero } from '../components/layout/PageHero';
import { OraPlusTeaserStrip } from '../components/common/OraPlusTeaserStrip';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface CalendarPickerProps {
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  minDateStr: string;
}

const CalendarPicker = ({ availableDates, selectedDate, onSelect, minDateStr }: CalendarPickerProps) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday-first: 0=Mon … 6=Sun
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const canPrev = (() => {
    const [my, mm] = minDateStr.split('-').map(Number);
    return year > my || (year === my && month > mm - 1);
  })();

  return (
    <div className="w-full select-none">
      {/* Header mois */}
      <div className="flex items-center justify-between mb-6">
        <button type="button"
          onClick={prev}
          disabled={!canPrev}
          className="w-11 h-11 flex items-center justify-center text-black/30 hover:text-black disabled:opacity-20 transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-[11px] font-normal uppercase tracking-[0.28em] text-noir">
          {MOIS[month]} {year}
        </p>
        <button type="button"
          onClick={next}
          className="w-11 h-11 flex items-center justify-center text-black/30 hover:text-black transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 mb-2">
        {JOURS.map((j, i) => (
          <div key={i} className="text-center text-[9px] font-normal uppercase tracking-[0.15em] text-black/25 py-1">
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = toYMD(year, month, day);
          const isPast = dateStr < minDateStr;
          const isAvailable = availableDates.has(dateStr);
          const isSelected = dateStr === selectedDate;

          return (
            <button type="button"
              key={i}
              disabled={isPast || !isAvailable}
              onClick={() => onSelect(dateStr)}
              className={[
                'mx-auto w-11 h-11 flex flex-col items-center justify-center rounded-[2px] text-[12px] font-normal transition-all duration-150',
                isSelected
                  ? 'bg-noir text-white'
                  : isAvailable && !isPast
                  ? 'text-noir hover:bg-noir/[0.06] cursor-pointer'
                  : 'text-black/18 cursor-default',
              ].filter(Boolean).join(' ')}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {day}
              {isAvailable && !isPast && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#1E3529] mt-0.5 block" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const schema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenom: z.string().min(2, 'Prénom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter le traitement de vos données pour réserver.',
  }),
});

type FormData = z.infer<typeof schema>;

const PROGRAMME = [
  { icon: Activity, title: 'Analyse corporelle', desc: 'Composition corporelle, IMC, masse musculaire et graisseuse' },
  { icon: Utensils, title: 'Bilan nutritionnel', desc: 'Habitudes alimentaires, apports, carences et recommandations personnalisées' },
  { icon: Sparkles, title: 'Skincare', desc: 'Analyse de peau, routine recommandée et produits adaptés à ton profil' },
  { icon: Target, title: 'Challenge 21 jours', desc: 'Programme personnalisé et objectifs concrets pour transformer tes habitudes' },
];

const inputClass =
  'w-full border-0 border-b border-noir/10 bg-transparent py-4 text-base text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors';

const BilanBienEtre = () => {
  useEffect(() => { document.title = 'Bilan bien-être — PessÓra'; }, []);
  const { container, item, isReducedMotion } = useStaggerReveal();
  const { user } = useAuth();
  const [slots, setSlots] = useState<BilanSlot[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BilanSlot | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [slotsLoading, setSlotsLoading] = useState(true);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: user?.lastName ?? '',
      prenom: user?.firstName ?? '',
      telephone: user?.phone ?? '',
      email: user?.email ?? '',
      notes: '',
      privacyAccepted: false,
    },
  });

  useEffect(() => {
    let cancelled = false;
    const fetchSlots = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bilan_slots')
        .select('*')
        .eq('disponible', true)
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('heure', { ascending: true });

      if (cancelled) return;

      if (error) {
        setFetchError('Impossible de charger les créneaux. Réessaie plus tard.');
      } else {
        setSlots(data ?? []);
      }
      setSlotsLoading(false);
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        nom: user.lastName ?? '',
        prenom: user.firstName ?? '',
        telephone: user.phone ?? '',
        email: user.email ?? '',
        notes: '',
        privacyAccepted: false,
      }, { keepDirty: true });
    }
  }, [user, reset]);

  const availableDates = new Set(slots.map(s => s.date));

  const timeSlotsForDate = selectedDate
    ? slots.filter(s => s.date === selectedDate)
    : [];

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot) return;
    setSubmitStatus('idle');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('bilan_bookings').insert({
      slot_id: selectedSlot.id,
      user_id: user?.id ?? null,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email || null,
      date_rdv: selectedSlot.date,
      heure_rdv: selectedSlot.heure,
      statut: 'en_attente' as const,
      notes: data.notes || null,
    });

    if (error) {
      setSubmitStatus('error');
      return;
    }

    const { error: updateError } = await db.from('bilan_slots').update({ disponible: false } as any).eq('id', selectedSlot.id);
    if (updateError) {
      if (import.meta.env.DEV) console.error('[BilanBienEtre] slot update error:', updateError);
    }
    setSubmitStatus('success');
  };

  const minDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen">

      <PageHero
        eyebrow="Gratuit · 30 minutes"
        title={<>Bilan <em className="italic text-black/55">Bien-être</em></>}
        subtitle="30 minutes pour comprendre ton corps, tes habitudes et définir un programme qui te ressemble vraiment."
      />

      {/* Programme */}
      <section className="bg-white px-4 md:px-10 lg:px-[72px] py-[56px]">
        <div className="mx-auto mb-10 max-w-3xl">
          <OraPlusTeaserStrip variant="muted" />
        </div>
        <motion.ol
          className="divide-y divide-black/[0.06] mb-[64px]"
          variants={container}
          initial={isReducedMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
          aria-label="Programme du bilan"
        >
          {PROGRAMME.map(({ title, desc }, idx) => (
            <motion.li key={title} variants={item} className="flex items-baseline gap-8 py-6 md:gap-12 lg:gap-16">
              <span
                className="shrink-0 font-display font-normal text-black/[0.12] leading-none select-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 40px)' }}
                aria-hidden="true"
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 flex flex-col gap-1 md:flex-row md:items-baseline md:gap-10">
                <h3
                  className="shrink-0 font-display font-normal text-noir"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 1.6vw, 20px)' }}
                >
                  {title}
                </h3>
                <p className="text-[11px] text-black/40 leading-[1.65] md:border-l md:border-noir/[0.06] md:pl-10">
                  {desc}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        {/* Réservation */}
        {submitStatus === 'success' ? (
          <div className="max-w-xl mx-auto text-center py-16" aria-live="polite">
            <CheckCircle size={52} strokeWidth={1} className="text-gold-dim mx-auto mb-6" aria-hidden="true" />
            <h2
              className="font-display font-normal text-noir mb-4"
              style={{ fontFamily: 'var(--font-display)', fontSize: '36px' }}
            >
              Réservation reçue !
            </h2>
            <p className="text-[12px] text-black/50 leading-[1.7]">
              L'équipe PessÓra te confirme ton rendez-vous par WhatsApp sous 24h.
            </p>
            {selectedSlot && (
              <p className="text-[11px] text-black/30 mt-3 capitalize">
                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' '}à {selectedSlot.heure.slice(0, 5)}
              </p>
            )}
            <Link
              to="/evenements"
              className="inline-flex items-center gap-2 mt-8 text-gold-dim text-[11px] font-normal uppercase tracking-[0.12em] hover:opacity-70 transition-opacity"
            >
              Voir aussi nos événements <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <h2
              className="font-display font-normal text-noir tracking-[-0.01em] mb-8 text-center"
              style={{ fontFamily: 'var(--font-display)', fontSize: '36px' }}
            >
              Choisir mon créneau
            </h2>

            {/* Stepper visuel — dérivé du state (non cliquable, feedback uniquement) */}
            <Stepper
              currentStep={!selectedDate ? 0 : !selectedSlot ? 1 : 2}
              size="sm"
              className="mx-auto mb-12 max-w-xl"
              aria-label="Étapes de réservation"
            >
              <Stepper.Step>
                <Stepper.Indicator />
                <Stepper.Content>
                  <Stepper.Title>Date</Stepper.Title>
                </Stepper.Content>
                <Stepper.Separator />
              </Stepper.Step>
              <Stepper.Step>
                <Stepper.Indicator />
                <Stepper.Content>
                  <Stepper.Title>Créneau</Stepper.Title>
                </Stepper.Content>
                <Stepper.Separator />
              </Stepper.Step>
              <Stepper.Step>
                <Stepper.Indicator />
                <Stepper.Content>
                  <Stepper.Title>Coordonnées</Stepper.Title>
                </Stepper.Content>
              </Stepper.Step>
            </Stepper>

            {submitStatus === 'error' && (
              <div className="mx-auto mb-8 flex max-w-lg items-start gap-3 rounded-[2px] border border-red-200/80 bg-red-50/90 p-4 text-[12px] text-red-800" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                Une erreur est survenue. Réessaie ou contacte-nous sur Instagram.
              </div>
            )}

            {fetchError && (
              <div className="mx-auto mb-8 flex max-w-lg items-start gap-3 rounded-[2px] border border-orange-200/80 bg-orange-50/90 p-4 text-[12px] text-orange-800" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                {fetchError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

              {/* Calendrier + créneaux */}
              <div className="space-y-8">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-16" role="status">
                    <span className="sr-only">Chargement des créneaux…</span>
                    <Spinner size="md" color="current" className="text-noir/80" aria-hidden="true" />
                  </div>
                ) : !fetchError && slots.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-[2px] border border-noir/[0.06]">
                    <Clock size={32} strokeWidth={1} className="mx-auto text-black/25 mb-4" aria-hidden="true" />
                    <p className="text-[12px] text-black/40">
                      Aucun créneau disponible pour le moment. Contacte-nous sur Instagram.
                    </p>
                  </div>
                ) : !fetchError ? (
                  <>
                    <div className="bg-white rounded-[2px] border border-noir/[0.06] p-6">
                      <CalendarPicker
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                        minDateStr={minDateStr}
                      />
                    </div>

                    {selectedDate && timeSlotsForDate.length > 0 && (
                      <div>
                        <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 mb-4">
                          Créneaux disponibles
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Créneaux horaires disponibles">
                          {timeSlotsForDate.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              aria-pressed={selectedSlot?.id === slot.id}
                              className={`h-11 min-h-11 py-3 px-4 rounded-[2px] text-[12px] font-normal tracking-wide transition-colors duration-200 ${
                                selectedSlot?.id === slot.id
                                  ? 'bg-noir text-white'
                                  : 'bg-white border border-noir/[0.1] text-black hover:border-noir/30'
                              }`}
                            >
                              {slot.heure.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && timeSlotsForDate.length === 0 && (
                      <p className="text-[12px] text-black/40 text-center">
                        Aucun créneau disponible ce jour-là.
                      </p>
                    )}
                  </>
                ) : null}
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-[2px] p-[40px] border border-noir/[0.06]">
                <h3
                  className="font-display font-normal text-noir mb-6"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}
                >
                  Tes coordonnées
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller name="prenom" control={control} render={({ field }) => (
                      <div className="space-y-1">
                        <label htmlFor="prenom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Prénom *</label>
                        <input id="prenom" {...field} type="text" autoComplete="given-name" placeholder="Jean" className={inputClass} />
                        {errors.prenom?.message && <p className="text-[11px] text-red-600">{errors.prenom.message}</p>}
                      </div>
                    )} />
                    <Controller name="nom" control={control} render={({ field }) => (
                      <div className="space-y-1">
                        <label htmlFor="nom" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">Nom *</label>
                        <input id="nom" {...field} type="text" autoComplete="family-name" placeholder="Dupont" className={inputClass} />
                        {errors.nom?.message && <p className="text-[11px] text-red-600">{errors.nom.message}</p>}
                      </div>
                    )} />
                  </div>

                  <Controller name="telephone" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="telephone" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Téléphone * <span className="normal-case text-black/25">(WhatsApp)</span>
                      </label>
                      <input id="telephone" {...field} type="tel" autoComplete="tel" inputMode="tel" placeholder="0696 XX XX XX" className={inputClass} />
                      {errors.telephone?.message && <p className="text-[11px] text-red-600">{errors.telephone.message}</p>}
                    </div>
                  )} />

                  <Controller name="email" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Email <span className="normal-case text-black/25">(optionnel)</span>
                      </label>
                      <input id="email" {...field} type="email" autoComplete="email" inputMode="email" placeholder="votre@email.com" className={inputClass} />
                      {errors.email?.message && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
                    </div>
                  )} />

                  <Controller name="notes" control={control} render={({ field }) => (
                    <div className="space-y-1">
                      <label htmlFor="notes" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/40 block">
                        Message <span className="normal-case text-black/25">(optionnel)</span>
                      </label>
                      <textarea
                        id="notes"
                        {...field}
                        rows={3}
                        placeholder="Objectifs, questions, informations utiles..."
                        className="w-full border-b border-noir/10 bg-transparent py-3 text-base text-noir placeholder:text-black/30 focus:outline-none focus:border-noir transition-colors resize-none"
                      />
                    </div>
                  )} />

                  {!selectedSlot && (
                    <p className="text-[11px] text-orange-600" role="status">
                      Sélectionne d'abord une date et un créneau dans le calendrier.
                    </p>
                  )}

                  <Controller
                    name="privacyAccepted"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label htmlFor="bilan-privacy-accepted" className="flex cursor-pointer items-start gap-3">
                          <input
                            id="bilan-privacy-accepted"
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-gold-dim"
                          />
                          <span className="text-[11px] font-light leading-relaxed text-black/55">
                            J’accepte le traitement de mes données pour la prise de rendez-vous et le suivi du bilan,
                            conformément à la{' '}
                            <Link
                              to="/politique-confidentialite"
                              className="text-gold-dim underline decoration-gold-dim/30 underline-offset-2 hover:opacity-80"
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
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full bg-noir text-white py-4 rounded-full font-normal uppercase tracking-[0.1em] text-[11px] hover:bg-anthracite transition-colors disabled:opacity-40"
                  >
                    {isSubmitting ? 'Réservation…' : 'Confirmer mon Bilan Bien-être'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default BilanBienEtre;
