// src/pages/ContactPartenariat.tsx
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, Mail, Users } from 'lucide-react';
import { Button, Card, Input, Label, TextArea, TextField, cn } from '@heroui/react';
import { barInfo } from '../data/infoData';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import {
  contactPartnershipSchema,
  partnershipTypeLabels,
  partnershipTypeKeys,
  type ContactPartnershipFormValues,
} from '../lib/contactPartnershipSchema';
import { PageShell } from '../components/layout/PageShell';
import { PageHero } from '../components/layout/PageHero';

const fieldClass = cn(
  'w-full border-0 border-b border-noir/10 bg-transparent py-3 min-h-11 text-base font-light text-black',
  'placeholder:text-black/35 focus-visible:border-noir',
);

const ContactPartenariat = () => {
  const fadeForm = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactPartnershipFormValues>({
    resolver: zodResolver(contactPartnershipSchema),
    defaultValues: {
      organisation: '',
      contactName: '',
      email: '',
      phone: '',
      partnershipType: 'evenement_popup',
      message: '',
      acceptPrivacy: false,
    },
  });

  const onSubmit = (_values: ContactPartnershipFormValues) => {
    if ((honeypotRef.current?.value ?? '').trim() !== '') {
      setSuccess(true);
      reset();
      return;
    }
    setSuccess(true);
    reset({
      organisation: '',
      contactName: '',
      email: '',
      phone: '',
      partnershipType: 'evenement_popup',
      message: '',
      acceptPrivacy: false,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Partenariats"
        title={
          <>
            Travailler <span className="italic text-black/55">avec</span> Pessóra
          </>
        }
      />
      <div className="pb-24 pt-10 md:pt-14">
        <PageShell>
          <div className="mx-auto max-w-6xl">
            <p className="mx-auto mb-12 max-w-2xl text-center text-[14px] font-light leading-relaxed text-black/55">
              Marques, salles de sport, médias, organisateurs : présentez votre projet (pop-up, sponsoring,
              animation, corner produit…). Nous vous répondons sous{' '}
              <span className="text-black/75">48 à 72 h ouvrées</span>.
            </p>

            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
              <motion.div
                className="space-y-10"
                variants={container}
                initial={isReducedMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={{ once: true, amount: 0.15, margin: '0px 0px -48px 0px' }}
              >
                <motion.div variants={item} className="rounded-[2px] border border-noir/[0.06] bg-noir/[0.02] p-8 md:p-10">
                  <div className="mb-6 flex items-center gap-3">
                    <Building2 size={22} strokeWidth={1.35} className="text-black/55" aria-hidden />
                    <h4 className="text-[11px] font-normal uppercase tracking-[0.18em] text-black/45">
                      Pour qui ?
                    </h4>
                  </div>
                  <ul className="space-y-3 text-[14px] font-light leading-relaxed text-black/70">
                    <li>• Événements sportifs, bien-être, food & lifestyle</li>
                    <li>• Salles, associations, retailers complémentaires</li>
                    <li>• Presse, influence, contenus éditoriaux</li>
                  </ul>
                </motion.div>

                <motion.div variants={item} className="rounded-[2px] border border-noir/[0.06] p-8 md:p-10">
                  <div className="mb-6 flex items-center gap-3">
                    <Users size={22} strokeWidth={1.35} className="text-black/55" aria-hidden />
                    <h4 className="text-[11px] font-normal uppercase tracking-[0.18em] text-black/45">
                      Contact équipe
                    </h4>
                  </div>
                  <p className="text-[15px] font-light text-black">{barInfo.contact.email}</p>
                  <p className="mt-4 text-[12px] font-light text-black/45">
                    Une question client ou le bar ?{' '}
                    <Link to="/contact" className="text-editorial-link-underline text-black/60 hover:text-black">
                      Page contact générale
                    </Link>
                    .
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <Card className="relative overflow-hidden bg-noir p-8 text-white shadow-none md:p-10">
                    <h4
                      className="mb-4 font-display text-lg font-normal italic text-white/95"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Pistes de collaboration
                    </h4>
                    <p className="text-[13px] font-light leading-relaxed text-white/75">
                      Pop-up dans votre lieu, activation autour du run club, corner boissons, offre groupes,
                      co-marketing — indiquez votre idée dans le formulaire, même à tiroir.
                    </p>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div {...fadeForm}>
                <Card className="bg-surface-muted p-8 shadow-none md:p-10">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail size={18} strokeWidth={1.35} className="text-black/40" aria-hidden />
                    <h3
                      className="font-display text-2xl font-normal text-black"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Proposition de partenariat
                    </h3>
                  </div>
                  <p className="mb-8 text-[12px] font-light text-black/45">
                    Plus vous êtes précis (dates, lieu, volumétrie), plus notre réponse sera utile.
                  </p>

                  {success && (
                    <p
                      className="mb-6 rounded-[2px] border border-noir/10 bg-white px-4 py-3 text-[13px] font-light text-black/75"
                      role="status"
                    >
                      Merci — votre demande a bien été enregistrée. Nous vous contacterons à l’adresse indiquée.
                      (Envoi automatique à venir : en attendant, vous pouvez aussi nous écrire directement à{' '}
                      <a href={`mailto:${barInfo.contact.email}`} className="text-editorial-link-underline">
                        {barInfo.contact.email}
                      </a>
                      .)
                    </p>
                  )}

                  <form
                    className="space-y-6"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                  >
                    <input
                      ref={honeypotRef}
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
                      name="website"
                    />

                    <TextField className="space-y-2">
                      <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                        Structure / marque
                      </Label>
                      <Input
                        type="text"
                        autoComplete="organization"
                        placeholder="Ex. Studio GigaFit, média…"
                        variant="secondary"
                        aria-invalid={errors.organisation ? true : undefined}
                        className={cn(fieldClass, errors.organisation && 'border-red-500/40')}
                        {...register('organisation')}
                      />
                      {errors.organisation && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.organisation.message}
                        </p>
                      )}
                    </TextField>

                    <TextField className="space-y-2">
                      <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                        Votre nom
                      </Label>
                      <Input
                        type="text"
                        autoComplete="name"
                        variant="secondary"
                        aria-invalid={errors.contactName ? true : undefined}
                        className={cn(fieldClass, errors.contactName && 'border-red-500/40')}
                        {...register('contactName')}
                      />
                      {errors.contactName && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.contactName.message}
                        </p>
                      )}
                    </TextField>

                    <TextField className="space-y-2">
                      <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                        E-mail professionnel
                      </Label>
                      <Input
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        variant="secondary"
                        aria-invalid={errors.email ? true : undefined}
                        className={cn(fieldClass, errors.email && 'border-red-500/40')}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.email.message}
                        </p>
                      )}
                    </TextField>

                    <TextField className="space-y-2">
                      <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                        Téléphone <span className="normal-case text-black/35">(optionnel)</span>
                      </Label>
                      <Input
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        variant="secondary"
                        className={fieldClass}
                        {...register('phone')}
                      />
                    </TextField>

                    <div className="space-y-2">
                      <Label
                        htmlFor="partnership-type"
                        className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40"
                      >
                        Type de projet
                      </Label>
                      <select
                        id="partnership-type"
                        className={cn(
                          fieldClass,
                          'cursor-pointer text-base rounded-none border-b border-noir/10 bg-transparent',
                          errors.partnershipType && 'border-red-500/40',
                        )}
                        aria-invalid={errors.partnershipType ? true : undefined}
                        {...register('partnershipType')}
                      >
                        {partnershipTypeKeys.map((key) => (
                          <option key={key} value={key}>
                            {partnershipTypeLabels[key]}
                          </option>
                        ))}
                      </select>
                      {errors.partnershipType && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.partnershipType.message}
                        </p>
                      )}
                    </div>

                    <TextField className="space-y-2">
                      <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                        Votre projet
                      </Label>
                      <TextArea
                        rows={5}
                        placeholder="Contexte, dates envisagées, lieu, objectifs, budget si pertinent…"
                        variant="secondary"
                        aria-invalid={errors.message ? true : undefined}
                        className={cn(
                          fieldClass,
                          'resize-y min-h-[120px]',
                          errors.message && 'border-red-500/40',
                        )}
                        {...register('message')}
                      />
                      {errors.message && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.message.message}
                        </p>
                      )}
                    </TextField>

                    <div className="space-y-2 pt-2">
                      <label htmlFor="partnership-privacy" className="flex cursor-pointer items-start gap-3">
                        <Controller
                          name="acceptPrivacy"
                          control={control}
                          render={({ field }) => (
                            <input
                              id="partnership-privacy"
                              type="checkbox"
                              className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-noir"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              onBlur={field.onBlur}
                              ref={field.ref}
                            />
                          )}
                        />
                        <span className="text-[11px] font-light leading-relaxed text-black/55">
                          J’accepte que mes données soient utilisées pour traiter cette demande de partenariat,
                          conformément à la{' '}
                          <Link
                            to="/politique-confidentialite"
                            className="text-black/75 underline decoration-black/20 underline-offset-2 hover:text-black"
                          >
                            politique de confidentialité
                          </Link>
                          .
                        </span>
                      </label>
                      {errors.acceptPrivacy && (
                        <p className="text-[11px] text-red-600" role="alert">
                          {errors.acceptPrivacy.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-noir py-4 text-[10px] font-normal uppercase tracking-[0.14em] text-white hover:bg-anthracite"
                    >
                      Envoyer la proposition <ArrowRight size={14} aria-hidden />
                    </Button>
                  </form>
                </Card>
              </motion.div>
            </div>
          </div>
        </PageShell>
      </div>
    </div>
  );
};

export default ContactPartenariat;
