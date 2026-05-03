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
};

export function NewsletterSignup({ className, align = 'left' }: NewsletterSignupProps) {
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

  return (
    <div
      className={cn('mt-8 max-w-sm', isCenter && 'mx-auto w-full text-center', className)}
    >
      <p className="mb-3 text-[9px] font-light uppercase tracking-[0.42em] text-white/42">Newsletter</p>
      <p
        className={cn(
          'mb-4 text-[11px] font-light leading-relaxed tracking-[0.04em] text-white/45',
          isCenter && 'mx-auto max-w-[280px]',
        )}
      >
        Offres, nouveautés et événements — une fois de temps en temps, jamais spam.
      </p>
      <Form
        onSubmit={handleSubmit(onSubmit)}
        className={cn('flex flex-col gap-4', isCenter && 'items-stretch sm:items-center')}
      >
        <div
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:items-stretch',
            isCenter && 'sm:justify-center',
          )}
        >
          <Label htmlFor="newsletter-email" className="sr-only">
            Adresse e-mail
          </Label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            className="min-h-[48px] min-w-0 flex-1 rounded-[2px] border border-white/[0.12] bg-white/[0.06] px-4 text-[12px] font-light text-white placeholder:text-white/30"
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
            className="min-h-[48px] min-w-[48px] shrink-0 rounded-[2px] bg-white text-noir transition-colors hover:bg-white/90 disabled:opacity-50"
            aria-label="S’inscrire à la newsletter"
          >
            <Send size={16} strokeWidth={1.5} className={status === 'loading' ? 'animate-pulse' : ''} />
          </Button>
        </div>
        <div className={cn('text-left', isCenter && 'sm:mx-auto sm:max-w-sm')}>
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
                <span className="text-[11px] font-light leading-relaxed tracking-[0.04em] text-white/50">
                  J’accepte de recevoir la newsletter et j’ai pris connaissance de la{' '}
                  <Link
                    to="/politique-confidentialite"
                    className="text-white/70 underline decoration-white/30 underline-offset-2 hover:text-white/90"
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
        <p className="mt-2 text-[11px] font-light tracking-wide text-gold">Merci — vous êtes inscrit·e.</p>
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
