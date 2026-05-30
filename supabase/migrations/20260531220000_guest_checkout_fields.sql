-- PESSORA — Checkout invité : nom, téléphone, token d'accès (Phase 2)

-- Ajouter les colonnes pour le mode invité
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rgpd_consent BOOLEAN DEFAULT false;

-- Générer des tokens pour les commandes existantes
UPDATE public.orders SET access_token = replace(gen_random_uuid()::text, '-', '')
  WHERE access_token IS NULL;

-- Mettre à jour les RLS pour permettre la lecture par token
DROP POLICY IF EXISTS "Anyone can read order by access token" ON public.orders;
CREATE POLICY "Anyone can read order by access token" ON public.orders
  FOR SELECT
  USING (access_token IS NOT NULL);
