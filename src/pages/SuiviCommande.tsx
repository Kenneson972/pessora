import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CreditCard, ChefHat, CheckCircle, Package } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { supabase } from '../lib/supabaseClient';
import type { OrderWithItems } from '../hooks/useOrders';

const STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Clock },
  { key: 'paid', label: 'Paiement confirmé', icon: CreditCard },
  { key: 'preparing', label: 'En préparation', icon: ChefHat },
  { key: 'ready', label: 'Prête ! Passez la chercher', icon: CheckCircle },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let query = db.from('orders').select('*, order_items(*)');
    if (token) {
      query = query.eq('access_token', token);
    } else {
      query = query.eq('id', orderId);
    }
    query.single()
      .then(({ data, error: err }: { data: OrderWithItems | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err || !data) {
          setError('Commande introuvable.');
        } else {
          setOrder(data);
        }
        setLoading(false);
      });

    const trackId = token ?? orderId!;
    const filterCol = token ? 'access_token' : 'id';
    const channel = supabase
      .channel(`order-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `${filterCol}=eq.${trackId}` },
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-[13px] text-black/35">Chargement de votre commande…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <PageShell className="py-20 text-center">
          <p className="mb-6 text-[14px] text-black/50">{error ?? 'Commande introuvable.'}</p>
          <Link
            to="/menu"
            className="inline-flex h-11 min-h-[44px] items-center rounded-full border border-noir/15 px-6 text-[10px] uppercase tracking-[0.1em] text-black/55 hover:border-noir/30 hover:text-black"
          >
            Retour au menu
          </Link>
        </PageShell>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const items = order.order_items ?? [];
  const itemNames = items.map((it) => `${it.quantity}× ${it.product_name}`).join(', ');

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
            <span className="text-black/70" aria-current="page">Suivi de commande</span>
          </nav>
        </PageShell>
      </div>

      <section>
        <PageShell className="py-12 lg:py-20">
          <div className="mx-auto max-w-md">
            <h1
              className="mb-2 text-center font-display font-normal leading-[1.05] text-black"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)' }}
            >
              Votre commande
            </h1>
            {itemNames && (
              <p className="mb-2 text-center text-[12px] font-light text-black/45 truncate">{itemNames}</p>
            )}
            <p className="mb-10 text-center font-mono text-[11px] text-black/30">
              N° {order.id.slice(0, 8)}
            </p>

            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const isActive = i <= currentIdx;
                const isCurrent = i === currentIdx;
                const StepIcon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 border-l-2 py-5 pl-6"
                    style={{
                      borderColor: isActive
                        ? isCurrent
                          ? 'var(--color-sapin)'
                          : 'rgb(0 0 0 / 0.12)'
                        : 'rgb(0 0 0 / 0.06)',
                    }}
                  >
                    <StepIcon
                      size={20}
                      strokeWidth={1.5}
                      className={
                        isCurrent
                          ? 'text-sapin'
                          : isActive
                          ? 'text-black/40'
                          : 'text-black/15'
                      }
                    />
                    <div>
                      <p
                        className={`text-[14px] ${
                          isActive ? 'font-medium text-black' : 'font-light text-black/30'
                        }`}
                      >
                        {step.key === 'ready' && isCurrent
                          ? 'Prête ! Passez la chercher au comptoir'
                          : step.label}
                      </p>
                      {isCurrent && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <p className="mt-1 text-[11px] font-light text-sapin/70 animate-pulse">
                          En cours…
                        </p>
                      )}
                      {i < currentIdx && (
                        <p className="mt-1 text-[10px] font-light text-black/25">Terminé</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {order.status === 'cancelled' && (
              <div className="mt-8 rounded-[2px] border border-red-200 bg-red-50 px-5 py-4 text-center">
                <p className="text-[13px] font-medium text-red-700">Commande annulée</p>
                <p className="mt-1 text-[11px] text-red-500">Cette commande a été annulée.</p>
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                to="/menu"
                className="inline-flex h-11 min-h-[44px] items-center rounded-full border border-noir/15 px-6 text-[10px] uppercase tracking-[0.1em] text-black/55 hover:border-noir/30 hover:text-black"
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
