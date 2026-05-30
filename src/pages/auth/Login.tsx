// src/pages/auth/Login.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../lib/userFacingError';
import { authInputClass, authLabelClass, authFieldErrorRing } from '../../lib/authFormStyles';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { loginSchema, type LoginFormValues } from '../../lib/authSchemas';

const Login = () => {
  useEffect(() => { document.title = 'Connexion — PessÓra'; }, []);
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError('');
    setLoading(true);
    try {
      const loggedIn = await login(values.email, values.password);
      navigate(loggedIn?.role === 'admin' ? '/admin' : '/mon-espace');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setSubmitError(formatAuthError(msg));
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
        Connexion
      </h1>
      <p className="mb-8 text-editorial-product-meta">Accédez à votre espace membre</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
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
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`${authInputClass} ${errors.email ? authFieldErrorRing : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="mt-1 text-[11px] text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className={authLabelClass}>
              Mot de passe
            </label>
            <button
              type="button"
              onClick={async () => {
                const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
                if (!email) {
                  setSubmitError('Entrez votre adresse e-mail d\'abord.');
                  return;
                }
                try {
                  await resetPassword(email);
                  setResetSent(true);
                  setSubmitError('');
                } catch (e) {
                  setSubmitError(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
                }
              }}
              className="text-[10px] text-black/40 hover:text-black transition-colors underline underline-offset-2"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className={`${authInputClass} ${errors.password ? authFieldErrorRing : ''}`}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p id="login-password-error" className="mt-1 text-[11px] text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
        {resetSent && (
          <p className="text-[11px] text-sapin" role="status">
            Lien de réinitialisation envoyé. Vérifiez votre boîte de réception.
          </p>
        )}
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
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-8 text-center text-[11px] text-black/38">
        Pas encore membre ?{' '}
        <Link to="/inscription" className="text-editorial-link-underline inline-block">
          Créer un compte
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default Login;
