import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { Button, Checkbox, Form, Input, Label, cn } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';

const schema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: 'Cochez la case pour confirmer votre inscription et le traitement de votre email.',
  }),
});

type FormValues = z.infer<typeof schema>;

export type NewsletterSignupProps = {
  className?: string;
  /** Centré (bloc logo footer) ou aligné à gauche */
  align?: 'left' | 'center';
  /** Footer / blocs compacts — marges internes réduites */
  compact?: boolean;
  /** Pied de page ultra-compact : pas de paragraphe d’intro + titre sr-only */
  minimal?: boolean;
};

export function NewsletterSignup({
  className,
  align = 'left',
  compact = false,
  minimal = false,
}: NewsletterSignupProps) {
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', acceptPrivacy: false },
  });

  const onSubmit = async (data: FormValues) => {
    if (honeypotRef.current?.value) return;
    setStatus('loading');
    // Types Supabase générés : même pattern que AdminProduits pour les mutations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('newsletter_subscribers').insert({
      email: data.email.trim().toLowerCase(),
      consent: data.acceptPrivacy,
      source: 'footer',
    });
    if (error) {
      if (error.code === '23505') {
        setStatus('duplicate');
        reset();
        return;
      }
      setStatus('error');
      return;
    }
    setStatus('success');
    reset();
  };

  const isCenter = align === 'center';
  const showVisibleNewsletterHeading = !(compact && minimal);

  return (
    <div
      className={cn(
        compact ? 'max-w-sm' : 'mt-8 max-w-sm',
        isCenter && 'mx-auto w-full text-center',
        className,
      )}
    >
      {minimal && compact ? (
        <h3 id="newsletter-footer-heading" className="sr-only">
          Newsletter
        </h3>
      ) : null}
      {showVisibleNewsletterHeading ? (
        <p
          className={cn(
            'text-[9px] font-light uppercase tracking-[0.42em]',
            compact ? 'mb-1.5 text-footer-text-quiet' : 'mb-3 text-white/42',
          )}
        >
          Newsletter
        </p>
      ) : null}
      {!minimal || !compact ? (
        <p
          className={cn(
            'font-light tracking-[0.04em]',
            compact ? 'mb-2.5 text-[10px] leading-snug text-footer-text-muted' : 'mb-4 text-[11px] leading-relaxed text-white/45',
            isCenter && 'mx-auto max-w-[280px]',
            compact && isCenter && !minimal && 'max-w-[220px]',
          )}
        >
          {compact ? (
            <>Nouveautés ponctuelles — jamais de spam.</>
          ) : (
            <>
              Offres, nouveautés et événements — une fois de temps en temps, jamais spam.
            </>
          )}
        </p>
      ) : null}
      <Form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(
          'flex flex-col',
          compact && minimal ? 'gap-2' : compact ? 'gap-2.5' : 'gap-4',
          isCenter && 'items-stretch sm:items-center',
        )}
        aria-labelledby={minimal && compact ? 'newsletter-footer-heading' : undefined}
      >
        <div
          className={cn(
            'flex flex-col gap-1.5 sm:flex-row sm:items-stretch',
            isCenter && 'sm:justify-center',
          )}
        >
          <Label htmlFor="newsletter-email" className="sr-only">
            Adresse e-mail pour la newsletter
          </Label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder={compact && minimal ? 'Votre e-mail' : 'votre@email.com'}
            className={cn(
              'min-w-0 flex-1 rounded-[2px] border border-[color:var(--color-footer-border-soft)] bg-white/[0.06] py-2 font-light text-ivory placeholder:text-footer-text-subtle',
              compact && minimal ? 'min-h-12 px-4 text-[13px]' : compact ? 'min-h-11 px-4 text-[12px]' : 'min-h-[48px] px-4 text-[12px]',
            )}
            {...register('email')}
          />
          <input
            ref={honeypotRef}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            aria-hidden
          />
          <Button
            type="submit"
            isIconOnly
            isDisabled={status === 'loading'}
            className={cn(
              'shrink-0 rounded-[2px] bg-ivory text-noir transition-colors hover:bg-ivory-warm disabled:opacity-50',
              compact && minimal ? 'min-h-12 min-w-12' : compact ? 'min-h-11 min-w-11' : 'min-h-12 min-w-12',
            )}
            aria-label="S’inscrire à la newsletter"
          >
            <Send size={16} strokeWidth={1.5} className={status === 'loading' ? 'animate-pulse' : ''} />
          </Button>
        </div>
        <div
          className={cn(
            'text-left',
            isCenter && (compact && minimal ? 'mx-auto max-w-[min(100%,20rem)] sm:text-center' : 'sm:mx-auto sm:max-w-sm'),
          )}
        >
          <Controller
            control={control}
            name="acceptPrivacy"
            render={({ field }) => (
              <Checkbox
                id="newsletter-accept-privacy"
                isSelected={field.value}
                onChange={(isSelected) => field.onChange(Boolean(isSelected))}
                className="items-start text-left"
              >
                <span
                  className={cn(
                    'font-light tracking-[0.04em]',
                    compact && minimal
                      ? 'text-[10px] leading-snug text-footer-text-muted sm:text-[11px]'
                      : compact
                        ? 'text-[10px] leading-snug text-white/50'
                        : 'text-[11px] leading-relaxed text-white/50',
                  )}
                >
                  J’accepte de recevoir la newsletter et j’ai pris connaissance de la{' '}
                  <Link
                    to="/politique-confidentialite"
                    className="text-footer-text-muted underline decoration-[color:var(--color-footer-border-soft)] underline-offset-2 hover:text-ivory/90"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </Checkbox>
            )}
          />
          {errors.acceptPrivacy && (
            <p className="mt-2 text-[10px] font-light text-red-300/90">{errors.acceptPrivacy.message}</p>
          )}
        </div>
      </Form>
      {errors.email && (
        <p className="mt-2 text-[10px] font-light text-red-300/90">{errors.email.message}</p>
      )}
      {status === 'success' && (
        <p className="mt-2 text-[11px] font-light tracking-wide text-ivory/90">Merci — vous êtes inscrit·e.</p>
      )}
      {status === 'duplicate' && (
        <p className="mt-2 text-[11px] font-light text-white/50">Cette adresse est déjà inscrite.</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-[11px] font-light text-red-300/90">Impossible de finaliser. Réessayez plus tard.</p>
      )}
    </div>
  );
}
