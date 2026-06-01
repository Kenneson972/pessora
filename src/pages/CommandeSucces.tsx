import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useCart } from '../store/cartStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function CommandeSucces() {
  useEffect(() => { document.title = 'Commande confirmée — PessÓra'; }, []);
  const clearCart = useCart((s) => s.clearCart);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [token, setToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    clearCartRef.current();
    if (window.location.pathname.startsWith('//')) {
      navigateRef.current(window.location.pathname.replace(/\/+/g, '/'), { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    supabase.functions.invoke('get-order-for-success', {
      body: { stripe_session_id: sessionId },
    }).then(({ data }) => {
      if (cancelled || !data) return;
      if (data.access_token) setToken(data.access_token);
      if (data.id) setOrderId(data.id);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-white">
      <div>
        <PageShell className="py-5">
          <nav
            aria-label="Fil d'Ariane"
            className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left"
          >
            <Link to="/" className="transition-colors duration-200 hover:text-black">Accueil</Link>
            <span aria-hidden="true" className="text-sapin/35">/</span>
            <span className="text-black/70" aria-current="page">Paiement confirmé</span>
          </nav>
        </PageShell>
      </div>

      <section>
        <PageShell className="py-16 lg:py-24">
          <div className="mx-auto max-w-lg text-center">
            <CheckCircle
              className="mx-auto mb-8 h-12 w-12 text-sapin/70"
              strokeWidth={1}
              aria-hidden
            />
            <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-sapin/60">
              Paiement confirmé
            </p>
            <h1
              className="mb-4 font-display font-normal leading-none text-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              Merci pour
              <br />
              votre commande
            </h1>
            {token && (
              <p className="mx-auto mb-3 max-w-sm font-mono text-[11px] text-black/35">
                N° {token.slice(0, 8)}
              </p>
            )}
            <p className="mx-auto mb-10 max-w-sm text-[13px] font-light leading-relaxed text-black/50">
              Votre paiement a été validé. Votre commande est en cours de préparation.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {(token || orderId) && (
                <Link
                  to={`/suivi-commande?${token ? `token=${token}` : `order=${orderId}`}`}
                  className="inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full bg-sapin px-8 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-sapin/85"
                >
                  <Clock size={14} strokeWidth={1.5} />
                  Suivre ma commande
                </Link>
              )}
              {!token && !orderId && isAuthenticated && (
                <Link
                  to="/mon-espace/historique"
                  className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-sapin px-8 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-sapin/85"
                >
                  Voir mes commandes
                </Link>
              )}
              <Link
                to="/nos-produits"
                className="inline-flex h-12 min-h-12 items-center justify-center rounded-full border border-noir/15 px-8 text-[10px] font-normal uppercase tracking-[0.1em] text-black/55 transition-colors hover:border-noir/30 hover:text-black"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
