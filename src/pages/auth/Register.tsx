// src/pages/auth/Register.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatRegisterError } from '../../lib/userFacingError';
import {
  authInputClass,
  authInputNoIconClass,
  authLabelClass,
  authFieldErrorRing,
} from '../../lib/authFormStyles';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { registerSchema, type RegisterFormValues } from '../../lib/authSchemas';

const Register = () => {
  useEffect(() => { document.title = 'Créer un compte — PessÓra'; }, []);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      acceptLegal: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError('');
    setLoading(true);
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      setRegistered(true);
      setTimeout(() => navigate('/connexion'), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setSubmitError(formatRegisterError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <h1
        className="mb-1 font-display font-light text-[32px] leading-none text-black"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Créer un compte
      </h1>
      <p className="mb-8 text-editorial-product-meta">Rejoignez la communauté Pessóra</p>
      {registered ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-full bg-emerald-50 border border-emerald-200 px-6 py-4 text-[13px] text-emerald-700 text-center">
            <p className="font-medium mb-1">Compte créé avec succès !</p>
            <p className="text-[12px] text-emerald-600">
              Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.
            </p>
          </div>
          <p className="text-[11px] text-black/40">Redirection vers la connexion…</p>
          <Link
            to="/connexion"
            className="h-11 min-h-11 inline-flex items-center rounded-full bg-noir px-8 text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="register-firstname" className={authLabelClass}>
              Prénom
            </label>
            <div className="relative">
              <User
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                id="register-firstname"
                type="text"
                autoComplete="given-name"
                placeholder="Prénom"
                aria-invalid={errors.firstName ? true : undefined}
                aria-describedby={errors.firstName ? 'register-firstname-error' : undefined}
                className={`${authInputClass} ${errors.firstName ? authFieldErrorRing : ''}`}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p id="register-firstname-error" className="mt-1 text-[11px] text-red-600" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="register-lastname" className={authLabelClass}>
              Nom
            </label>
            <input
              id="register-lastname"
              type="text"
              autoComplete="family-name"
              placeholder="Nom"
              aria-invalid={errors.lastName ? true : undefined}
              aria-describedby={errors.lastName ? 'register-lastname-error' : undefined}
              className={`${authInputNoIconClass} ${errors.lastName ? authFieldErrorRing : ''}`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p id="register-lastname-error" className="mt-1 text-[11px] text-red-600" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="register-email" className={authLabelClass}>
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              className={`${authInputClass} ${errors.email ? authFieldErrorRing : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="register-email-error" className="mt-1 text-[11px] text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="register-password" className={authLabelClass}>
            Mot de passe
          </label>
          <div className="relative">
            <Lock
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
              className={`${authInputClass} ${errors.password ? authFieldErrorRing : ''}`}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p id="register-password-error" className="mt-1 text-[11px] text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="register-accept-legal" className="flex cursor-pointer items-start gap-3 text-left">
            <Controller
              name="acceptLegal"
              control={control}
              render={({ field }) => (
                <input
                  id="register-accept-legal"
                  type="checkbox"
                  aria-invalid={errors.acceptLegal ? true : undefined}
                  aria-describedby={errors.acceptLegal ? 'register-accept-error' : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border border-noir/20 accent-noir"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <span className="text-[11px] font-light leading-relaxed text-black/55">
              J’accepte la{' '}
              <Link to="/politique-confidentialite" className="text-editorial-link-underline text-black/70">
                politique de confidentialité
              </Link>{' '}
              et les{' '}
              <Link to="/cgv" className="text-editorial-link-underline text-black/70">
                conditions générales de vente
              </Link>
              .
            </span>
          </label>
          {errors.acceptLegal && (
            <p id="register-accept-error" className="mt-1 text-[11px] text-red-600" role="alert">
              {errors.acceptLegal.message}
            </p>
          )}
        </div>
        {submitError && (
          <p className="text-[11px] text-red-600" role="alert">
            {submitError}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 h-11 min-h-11 rounded-full bg-noir text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
        >
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
        </form>
        <p className="mt-8 text-center text-[11px] text-black/38">
          Déjà membre ?{' '}
          <Link to="/connexion" className="text-editorial-link-underline inline-block">
            Se connecter
          </Link>
        </p>
        </>
      )}
    </AuthSplitLayout>
  );
};

export default Register;
