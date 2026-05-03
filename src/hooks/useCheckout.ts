import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../store/cartStore';

export function useCheckout(pickupTime: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = useCart((s) => s.items);
  const navigate = useNavigate();

  const checkout = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/connexion?next=panier');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { items, user_id: session.user.id, pickup_time: pickupTime || null } },
      );

      if (fnError) {
        // Extraire le message métier depuis le corps de la réponse si disponible
        const ctx = (fnError as { context?: Response }).context;
        if (ctx?.json) {
          const body = await ctx.json().catch(() => null);
          setError(body?.error ?? fnError.message ?? 'Erreur lors du paiement');
        } else {
          setError(fnError.message ?? 'Erreur lors du paiement');
        }
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error ?? 'URL de paiement manquante');
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading, error };
}
