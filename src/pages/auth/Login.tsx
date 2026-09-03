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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.46H12v4.65h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

const Login = () => {
  useEffect(() => { document.title = 'Connexion — PessÓra'; }, []);
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth();
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

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-black/35">ou</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <button
          type="button"
          onClick={() =>
            loginWithGoogle().catch((e) =>
              setSubmitError(formatAuthError(e instanceof Error ? e.message : '')),
            )
          }
          className="h-11 min-h-11 flex items-center justify-center gap-2.5 rounded-full border border-black/15 bg-white text-[11px] font-normal uppercase tracking-[0.12em] text-black transition-colors hover:bg-black/5"
        >
          <GoogleIcon className="h-4 w-4" />
          Se connecter avec Google
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
