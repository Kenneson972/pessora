-- PESSORA — Bar Status & File d'attente (Phase 4)

CREATE TABLE IF NOT EXISTS public.bar_status (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_open BOOLEAN DEFAULT true,
  estimated_wait_minutes INT DEFAULT 5,
  max_capacity INT DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed row
INSERT INTO public.bar_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.bar_status ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Anyone can view bar status" ON public.bar_status FOR SELECT USING (true);

-- Admin update
CREATE POLICY "Admins can update bar status" ON public.bar_status FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
