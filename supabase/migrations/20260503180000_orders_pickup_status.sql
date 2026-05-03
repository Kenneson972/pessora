-- ============================================================
-- orders : ajout pickup_time, picked_up_at + nouveaux statuts
-- ============================================================

-- 1. Nouvelle colonne pickup_time (créneau de retrait choisi par le client)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMPTZ;

-- 2. Nouvelle colonne picked_up_at (date effective de retrait)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- 3. Mise à jour de la contrainte CHECK pour les nouveaux statuts
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
