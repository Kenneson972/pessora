import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import { authInputClass, authLabelClass } from '../../lib/authFormStyles';

const ReinitialisationMotDePasse = () => {
  useEffect(() => { document.title = 'Réinitialisation — PessÓra'; }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase redirects with #access_token — detect via code param or hash
  const hasSession = !!searchParams.get('code');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
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
        {done ? 'Mot de passe mis à jour' : 'Nouveau mot de passe'}
      </h1>
      <p className="mb-8 text-editorial-product-meta">
        {done
          ? 'Votre mot de passe a été réinitialisé avec succès.'
          : 'Choisissez un nouveau mot de passe sécurisé.'}
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 size={40} className="text-sapin" strokeWidth={1.3} />
          <button
            type="button"
            onClick={() => navigate('/connexion')}
            className="h-11 min-h-11 rounded-full bg-noir px-8 text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="reset-password" className={authLabelClass}>
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={authInputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="reset-confirm" className={authLabelClass}>
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Confirmez le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={authInputClass}
              />
            </div>
          </div>
          {error && (
            <p className="text-[11px] text-red-600" role="alert">
              {error}
            </p>
          )}
          {!hasSession && (
            <p className="text-[11px] text-amber-600">
              Utilisez le lien reçu par e-mail pour accéder à cette page.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-11 min-h-11 rounded-full bg-noir text-[11px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
          >
            {loading ? 'Mise à jour…' : 'Réinitialiser'}
          </button>
        </form>
      )}
    </AuthSplitLayout>
  );
};

export default ReinitialisationMotDePasse;
