-- PESSORA — Gestion Stocks & Alertes (Phase 6)

-- Colonne stock pour gamme_products
ALTER TABLE public.gamme_products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;

-- Table mouvements de stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.gamme_products(id),
  quantity INT NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Admin peut tout faire sur les mouvements
CREATE POLICY "Admins manage stock movements" ON public.stock_movements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
