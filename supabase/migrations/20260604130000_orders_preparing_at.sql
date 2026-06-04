-- Horodatage du passage en préparation, pour un timer Mode Bar correct
-- (auparavant basé sur created_at => délai « dépassé » faux si attente longue en paid).

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparing_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_order_preparing_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'preparing' AND OLD.status IS DISTINCT FROM 'preparing' AND NEW.preparing_at IS NULL THEN
    NEW.preparing_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_preparing_at ON public.orders;
CREATE TRIGGER orders_set_preparing_at
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_preparing_at();
