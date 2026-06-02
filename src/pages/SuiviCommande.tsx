import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CreditCard, ChefHat, CheckCircle, Package, UserPlus, Sparkles } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithItems } from '../hooks/useOrders';

const STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Clock },
  { key: 'paid', label: 'Paiement confirmé', icon: CreditCard },
  { key: 'preparing', label: 'En préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête !', icon: CheckCircle },
  { key: 'completed', label: 'Retirée', icon: Package },
];

export default function SuiviCommande() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const token = searchParams.get('token');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Suivi commande — PessÓra';
  }, []);

  useEffect(() => {
    if (!orderId && !token) {
      setError('Aucune commande spécifiée.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    if (token) {
      supabase.functions.invoke('get-order-by-token', {
        body: { access_token: token },
      }).then(({ data, error: fnError }) => {
        if (cancelled) return;
        if (fnError || !data) {
          setError('Commande introuvable.');
        } else {
          setOrder(data as OrderWithItems);
        }
        setLoading(false);
      }).catch(() => {
        if (!cancelled) { setError('Commande introuvable.'); setLoading(false); }
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      db.from('orders').select('*, order_items(*)')
        .eq('id', orderId)
        .single()
        .then(({ data, error: err }: { data: OrderWithItems | null; error: { message: string } | null }) => {
          if (cancelled) return;
          if (err || !data) {
            setError('Commande introuvable.');
          } else {
            setOrder(data);
          }
          setLoading(false);
        });
    }

    const trackId = orderId ?? token!;
    const filter = orderId ? `id=eq.${orderId}` : undefined;
    const channel = supabase
      .channel(`order-${trackId.substring(0, 36)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter },
        (payload: { new: Record<string, unknown> }) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } as OrderWithItems : prev));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm" role="status" aria-label="Chargement de votre commande">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sapin-subtle">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={32} strokeWidth={1.2} className="text-sapin/60" />
            </motion.div>
          </div>
          <p className="font-display text-[18px] text-black">Chargement de votre commande…</p>
          <p className="mt-1 text-[12px] text-black/40">Un instant</p>
        </motion.div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm">
        <div className="text-center">
          <p className="mb-6 text-[15px] text-black/60">{error ?? 'Commande introuvable.'}</p>
          <Link
            to="/menu"
            className="inline-flex h-12 min-h-[44px] items-center rounded-full bg-sapin px-8 text-[11px] font-medium uppercase tracking-[0.1em] text-white hover:bg-sapin/90 transition-colors"
          >
            Retour au menu
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const items = order.order_items ?? [];
  const itemNames = items.map((it) => `${it.quantity}× ${it.product_name}`).join(', ');
  const isGuest = !!token;
  const isDone = order.status === 'completed';
  const CurrentIcon = currentIdx >= 0 && currentIdx < STEPS.length ? STEPS[currentIdx].icon : Package;

  return (
    <div className="min-h-screen bg-surface-warm" style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(30,53,41,0.04), transparent 60%)' }}>
      {/* Breadcrumb */}
      <div className="border-b border-noir/[0.04] bg-white/60 backdrop-blur-sm">
        <PageShell className="py-4">
          <nav
            aria-label="Fil d'Ariane"
            className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left"
          >
            <Link to="/" className="transition-colors duration-200 hover:text-black">Accueil</Link>
            <span aria-hidden="true" className="text-sapin/35">/</span>
            <span className="text-black/60" aria-current="page">Suivi de commande</span>
          </nav>
        </PageShell>
      </div>

      {/* Hero — statut actuel */}
      <section className="relative overflow-hidden border-b border-noir/[0.04]">
        {/* Fond texturé subtil */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 40% 60%, #1E3529 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <PageShell className="py-16 lg:py-24">
          <div className="mx-auto max-w-md text-center">
            {/* Cercle statut */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              className={`mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full border-2 ${
                isDone
                  ? 'border-sapin/20 bg-sapin-subtle'
                  : order.status === 'cancelled'
                  ? 'border-red-200 bg-red-50'
                  : 'border-sapin/20 bg-sapin-subtle'
              }`}
            >
              <CurrentIcon
                size={44}
                strokeWidth={1.2}
                className={isDone ? 'text-sapin' : order.status === 'cancelled' ? 'text-red-500' : 'text-sapin'}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display font-normal leading-[1.05] text-black mb-3"
              style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}
            >
              {isDone
                ? 'Commande retirée !'
                : order.status === 'cancelled'
                ? 'Commande annulée'
                : order.status === 'ready'
                ? 'C\'est prêt !'
                : 'On s\'en occupe'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[13px] text-black/50 mb-3"
            >
              {isDone
                ? 'Merci de votre visite, à bientôt chez PessÓra'
                : order.status === 'cancelled'
                ? 'Cette commande n\'a pas abouti'
                : order.status === 'ready'
                ? 'Passez la récupérer au comptoir !'
                : 'Votre commande avance, suivez-la en temps réel'}
            </motion.p>

            {itemNames && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[12px] font-medium text-black/60 truncate"
              >
                {itemNames}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-1 font-mono text-[11px] text-black/35"
            >
              N° {order.id.slice(0, 8)}
            </motion.p>

            {!isDone && order.status !== 'cancelled' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-sapin-subtle px-5 py-2 text-[12px] font-medium text-sapin"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block h-2 w-2 rounded-full bg-sapin"
                />
                Mise à jour en direct
              </motion.p>
            )}
          </div>
        </PageShell>
      </section>

      {/* Timeline */}
      <section>
        <PageShell className="py-12 lg:py-16">
          <div className="mx-auto max-w-md">
            <p className="mb-8 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-black/30">
              Progression
            </p>

            <div className="space-y-0" role="list" aria-label="Étapes de la commande">
              {STEPS.map((step, i) => {
                const isActive = i <= currentIdx;
                const isCurrent = i === currentIdx;
                const isPast = i < currentIdx;
                const StepIcon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    role="listitem"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 + 0.3 }}
                    className={`flex items-start gap-5 border-l-2 py-5 pl-7 ${
                      isCurrent
                        ? 'border-l-sapin'
                        : isPast
                        ? 'border-l-sapin/25'
                        : 'border-l-noir/[0.06]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isCurrent
                          ? 'bg-sapin text-white shadow-[0_4px_20px_rgba(30,53,41,0.2)]'
                          : isPast
                          ? 'bg-sapin-subtle text-sapin'
                          : 'bg-noir/[0.04] text-black/20'
                      }`}
                    >
                      <StepIcon size={18} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 pt-1.5">
                      <p
                        className={`text-[15px] ${
                          isCurrent
                            ? 'font-bold text-black'
                            : isPast
                            ? 'font-medium text-black/65'
                            : 'font-light text-black/25'
                        }`}
                      >
                        {step.key === 'ready' && isCurrent
                          ? 'Prête ! Passez la chercher au comptoir'
                          : step.label}
                      </p>
                      {isCurrent && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <p className="mt-1.5 text-[11px] font-medium text-sapin/70 animate-pulse">
                          En cours…
                        </p>
                      )}
                      {isPast && (
                        <p className="mt-1 text-[10px] font-medium text-sapin/40">✓ Terminé</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {order.status === 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-2xl border border-red-200 bg-red-50/80 px-6 py-5 text-center"
              >
                <p className="text-[14px] font-medium text-red-700">Commande annulée</p>
                <p className="mt-1 text-[12px] text-red-500/80">Cette commande n&apos;a pas abouti.</p>
              </motion.div>
            )}
          </div>
        </PageShell>
      </section>

      {/* CTA invité + Commander à nouveau */}
      <section className="border-t border-noir/[0.04]">
        <PageShell className="py-12 lg:py-16">
          <div className="mx-auto max-w-md space-y-6">

            {isGuest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative overflow-hidden rounded-2xl bg-sapin p-8 text-center text-white"
              >
                {/* Fond décoratif */}
                <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                    <UserPlus size={28} strokeWidth={1.3} className="text-white" />
                  </div>
                  <h2 className="mb-2 font-display text-[22px] font-normal text-white">
                    Votre espace bien-être
                  </h2>
                  <p className="mb-6 text-[13px] font-light text-white/70">
                    Suivez toutes vos commandes, découvrez Óra+ et recevez des offres exclusives.
                  </p>
                  <Link
                    to="/inscription"
                    className="inline-flex h-12 min-h-[44px] items-center gap-2 rounded-full bg-white px-8 text-[11px] font-bold uppercase tracking-[0.1em] text-sapin hover:bg-white/95 transition-colors"
                  >
                    <UserPlus size={15} strokeWidth={1.8} />
                    Créer mon compte gratuitement
                  </Link>
                </div>
              </motion.div>
            )}

            <div className="text-center">
              <Link
                to="/menu"
                className="inline-flex h-12 min-h-[44px] items-center gap-2 rounded-full border-2 border-noir/[0.08] px-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/50 hover:border-noir/20 hover:text-black transition-colors"
              >
                Commander à nouveau
              </Link>
            </div>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
