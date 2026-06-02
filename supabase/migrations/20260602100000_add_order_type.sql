-- Migration: ajouter order_type et scheduled_pickup_date à orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'bar',
  ADD COLUMN IF NOT EXISTS scheduled_pickup_date TIMESTAMPTZ;

-- Index pour filtrer par type + statut (utilisé par RetraitsGamme et ModeBar)
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status);

-- Index pour le planning gamme (tri par date de retrait)
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_pickup ON orders(scheduled_pickup_date)
  WHERE order_type = 'gamme';

-- Fix: ajouter 'paid' et 'confirmed' au check constraint status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status = ANY (ARRAY['pending', 'paid', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'])
);
