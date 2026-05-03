import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { barInfo } from '../data/infoData';
import { Mail, MapPin, Instagram, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { Button, Card, Input, Label, TextArea, TextField, cn } from '@heroui/react';
import { Segment } from '@heroui-pro/react';
import { PageShell } from '../components/layout/PageShell';
import { PageHero } from '../components/layout/PageHero';
import { supabase } from '../lib/supabaseClient';

type RequestType = 'info' | 'reservation' | 'partenariat' | 'autre';

const Contact = () => {
  useEffect(() => { document.title = 'Contact — PessÓra'; }, []);
  const fadeForm = useFadeUpWhenVisible();
  const { container, item, isReducedMotion } = useStaggerReveal();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, [name]: 'Ce champ est requis.' }));
      return false;
    }
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email invalide.' }));
      return false;
    }
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    return true;
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!privacyAccepted) {
      setPrivacyError(true);
      return;
    }
    setPrivacyError(false);
    setSendError(null);
    setSending(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const message = (formData.get('message') as string)?.trim() || '';

    // Validate all fields on submit
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Ce champ est requis.';
    if (!email) errors.email = 'Ce champ est requis.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email invalide.';
    if (!message) errors.message = 'Ce champ est requis.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSending(false);
      return;
    }

    const { error } = await supabase.functions.invoke('send-contact-email', {
      body: { name, email, message, type: requestType },
    });

    setSending(false);
    if (error) {
      setSendError('Impossible d\'envoyer le message. Réessayez ou contactez-nous directement par email.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Nous contacter"
        title={<>Venez nous <span className="italic text-black/55">rencontrer</span></>}
      />
      <div className="pb-24 pt-10 md:pt-14">
      <PageShell>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
            <motion.div
              className="space-y-14"
              variants={container}
              initial={isReducedMotion ? false : 'hidden'}
              whileInView="visible"
              viewport={{ once: true, amount: 0.15, margin: '0px 0px -48px 0px' }}
            >
              <div className="space-y-10">
                <motion.div variants={item} className="group flex items-start gap-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-noir/[0.08] bg-white text-black transition-colors group-hover:bg-noir group-hover:text-white">
                    <MapPin size={18} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-normal uppercase tracking-[0.18em] text-black/40">Adresse</h4>
                    <p className="text-[17px] font-light text-black">{barInfo.address.fullAddress}</p>
                    <a
                      href={barInfo.address.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-all hover:gap-3 hover:text-black"
                    >
                      Voir sur Google Maps <ArrowRight size={12} />
                    </a>
                  </div>
                </motion.div>

                <motion.div variants={item} className="group flex items-start gap-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-noir/[0.08] bg-white text-black transition-colors group-hover:bg-noir group-hover:text-white">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-normal uppercase tracking-[0.18em] text-black/40">Email</h4>
                    <p className="text-[17px] font-light text-black">{barInfo.contact.email}</p>
                  </div>
                </motion.div>

                <motion.div variants={item} className="group flex items-start gap-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-noir/[0.08] bg-white text-black transition-colors group-hover:bg-noir group-hover:text-white">
                    <Instagram size={18} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-normal uppercase tracking-[0.18em] text-black/40">Instagram</h4>
                    <p className="text-[17px] font-light text-black">@pessora.mq</p>
                    <a
                      href={barInfo.contact.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/55 transition-all hover:gap-3 hover:text-black"
                    >
                      Nous suivre <ArrowRight size={12} />
                    </a>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={item}>
              <Card className="relative overflow-hidden bg-noir p-8 text-white shadow-none md:p-10">
                <h4 className="mb-6 font-display text-xl font-normal italic text-white/95" style={{ fontFamily: 'var(--font-display)' }}>
                  Horaires d’ouverture
                </h4>
                <div className="space-y-3 text-[14px] font-light text-white/80">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Lundi - Vendredi</span>
                    <span className="font-normal text-white">9:30 - 18:00</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Samedi</span>
                    <span className="font-normal text-white">10:30 - 14:00</span>
                  </div>
                  <div className="flex justify-between text-white/45">
                    <span>Dimanche</span>
                    <span className="font-normal">Fermé</span>
                  </div>
                </div>
              </Card>
              </motion.div>
            </motion.div>

            <motion.div {...fadeForm}>
            <Card className="bg-surface-muted p-8 shadow-none md:p-10">
              <h3 className="mb-4 font-display text-2xl font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
                Envoyez-nous un message
              </h3>
              <p className="mb-8 text-[12px] font-light leading-relaxed text-black/48">
                Projet{' '}
                <strong className="font-normal text-black/65">marque, média ou événement</strong> ? Utilisez la{' '}
                <Link to="/contact-partenariat" className="text-editorial-link-underline text-black/70 hover:text-black">
                  page partenariats
                </Link>
                .
              </p>
              <form
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                    Type de demande
                  </Label>
                  <Segment
                    size="sm"
                    aria-label="Type de demande"
                    selectedKey={requestType}
                    onSelectionChange={(k) => setRequestType((k as RequestType) ?? 'info')}
                  >
                    <Segment.Item id="info">Information</Segment.Item>
                    <Segment.Item id="reservation">Réservation</Segment.Item>
                    <Segment.Item id="partenariat">Partenariat</Segment.Item>
                    <Segment.Item id="autre">Autre</Segment.Item>
                  </Segment>
                  <input type="hidden" name="type" value={requestType} />
                </div>

                <TextField className="space-y-2" name="name">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Nom</Label>
                  <Input
                    type="text"
                    placeholder="Ex. Jean Dupont"
                    variant="secondary"
                    required
                    onBlur={(e) => validateField('name', e.target.value)}
                    onChange={() => fieldErrors.name && setFieldErrors(prev => ({ ...prev, name: '' }))}
                    className={cn(
                      'w-full border-0 border-b border-noir/10 bg-transparent py-3 text-[15px] font-light text-black',
                      fieldErrors.name && 'border-b-red-400',
                      'focus-visible:border-noir'
                    )}
                  />
                  {fieldErrors.name && (
                    <p className="text-[10px] text-red-500" role="alert">{fieldErrors.name}</p>
                  )}
                </TextField>
                <TextField className="space-y-2" name="email">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Email</Label>
                  <Input
                    type="email"
                    placeholder="vous@email.com"
                    variant="secondary"
                    required
                    onBlur={(e) => validateField('email', e.target.value)}
                    onChange={() => fieldErrors.email && setFieldErrors(prev => ({ ...prev, email: '' }))}
                    className={cn(
                      'w-full border-0 border-b border-noir/10 bg-transparent py-3 text-[15px] font-light text-black',
                      fieldErrors.email && 'border-b-red-400',
                      'focus-visible:border-noir'
                    )}
                  />
                  {fieldErrors.email && (
                    <p className="text-[10px] text-red-500" role="alert">{fieldErrors.email}</p>
                  )}
                </TextField>
                <TextField className="space-y-2" name="message">
                  <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">Message</Label>
                  <TextArea
                    rows={4}
                    placeholder="Comment pouvons-nous vous aider ?"
                    variant="secondary"
                    required
                    onBlur={(e) => validateField('message', e.target.value)}
                    onChange={() => fieldErrors.message && setFieldErrors(prev => ({ ...prev, message: '' }))}
                    className={cn(
                      'w-full resize-none border-0 border-b border-noir/10 bg-transparent py-3 text-[15px] font-light text-black',
                      fieldErrors.message && 'border-b-red-400',
                      'focus-visible:border-noir'
                    )}
                  />
                  {fieldErrors.message && (
                    <p className="text-[10px] text-red-500" role="alert">{fieldErrors.message}</p>
                  )}
                </TextField>
                {sendError && (
                  <p className="text-[11px] text-red-600" role="alert">{sendError}</p>
                )}
                <div className="space-y-2 pt-2">
                  <label htmlFor="contact-privacy" className="flex cursor-pointer items-start gap-3">
                    <input
                      id="contact-privacy"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        setPrivacyAccepted(e.target.checked);
                        if (e.target.checked) setPrivacyError(false);
                      }}
                      className="mt-1 h-4 w-4 shrink-0 rounded-[2px] border border-noir/15 accent-noir"
                    />
                    <span className="text-[11px] font-light leading-relaxed text-black/55">
                      J’accepte que mes informations soient utilisées pour répondre à ma demande, conformément à la{' '}
                      <Link
                        to="/politique-confidentialite"
                        className="text-black/75 underline decoration-black/20 underline-offset-2 hover:text-black"
                      >
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  {privacyError && (
                    <p className="text-[11px] text-red-600" role="alert">
                      Veuillez accepter la politique de confidentialité pour envoyer un message.
                    </p>
                  )}
                </div>
                {sent ? (
                  <div className="flex items-center gap-3 mt-4 rounded-full bg-emerald-50 border border-emerald-200 px-6 py-4 text-[12px] text-emerald-700">
                    <CheckCircle2 size={16} />
                    Message envoyé ! Nous vous répondrons dans les plus brefs délais.
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={sending}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-noir py-4 text-[10px] font-normal uppercase tracking-[0.14em] text-white hover:bg-anthracite disabled:opacity-50"
                  >
                    {sending ? 'Envoi…' : 'Envoyer'} <ArrowRight size={14} />
                  </Button>
                )}
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

export default Contact;
