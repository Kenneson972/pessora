import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { supabase } from '../lib/supabaseClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CommandeAnnulee() {
  useEffect(() => { document.title = 'Paiement annulé — PessÓra'; }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdRaw = searchParams.get('order_id');
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Si l'URL contient un double slash (ex: //commande/annulee), rediriger
    if (window.location.pathname.startsWith('//')) {
      navigate(window.location.pathname.replace(/\/+/g, '/'), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!orderIdRaw || !UUID_RE.test(orderIdRaw) || cancelledRef.current) return;
    cancelledRef.current = true;

    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderIdRaw)
          .eq('user_id', session.user.id)
          .eq('status', 'pending');
      } catch {
        /* RLS ou réseau : la commande restera pending ; nettoyage manuel possible côté admin */
      }
    })();
  }, [orderIdRaw]);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div>
        <PageShell className="py-5">
          <nav
            aria-label="Fil d'Ariane"
            className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left"
          >
            <Link to="/" className="transition-colors duration-200 hover:text-black">Accueil</Link>
            <span aria-hidden="true" className="text-[#1E3529]/35">/</span>
            <span className="text-black/70" aria-current="page">Paiement annulé</span>
          </nav>
        </PageShell>
      </div>

      <section>
        <PageShell className="py-16 lg:py-24">
          <div className="mx-auto max-w-lg text-center">
            <XCircle
              className="mx-auto mb-8 h-12 w-12 text-black/25"
              strokeWidth={1}
              aria-hidden
            />
            <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">
              Paiement annulé
            </p>
            <h1
              className="mb-4 font-display font-normal leading-none text-black"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              Votre commande
              <br />
              n'a pas abouti
            </h1>
            <p className="mx-auto mb-10 max-w-sm text-[13px] font-light leading-relaxed text-black/50">
              Aucun montant n'a été débité. Vous pouvez reprendre votre panier à tout moment.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full border border-noir/15 px-8 text-[10px] font-normal uppercase tracking-[0.1em] text-black/55 transition-colors hover:border-noir/30 hover:text-black"
              >
                <ArrowLeft size={14} strokeWidth={1.3} aria-hidden />
                Retour
              </button>
              <Link
                to="/menu"
                className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-[#1E3529] px-8 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#1E3529]/85"
              >
                Voir la carte
              </Link>
            </div>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
