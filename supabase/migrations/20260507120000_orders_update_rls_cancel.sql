-- Mise à jour des commandes : admins (file préparation) + membres (annuler un checkout abandonné tant que pending).

DROP POLICY IF EXISTS "Admins update all orders" ON public.orders;
CREATE POLICY "Admins update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Le membre ne peut passer QUE de pending → cancelled (pas toucher aux commandes payées).
DROP POLICY IF EXISTS "Users cancel own pending orders" ON public.orders;
CREATE POLICY "Users cancel own pending orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
