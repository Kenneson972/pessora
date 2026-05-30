CREATE TABLE IF NOT EXISTS public.home_carousel_cards (
  id         uuid primary key default gen_random_uuid(),
  position   integer not null default 0,
  eyebrow    text    not null default '',
  title      text    not null default '',
  image_url  text,
  link_to    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

ALTER TABLE public.home_carousel_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON public.home_carousel_cards;
CREATE POLICY "public read" ON public.home_carousel_cards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin write" ON public.home_carousel_cards;
CREATE POLICY "admin write" ON public.home_carousel_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS home_carousel_cards_position_idx ON public.home_carousel_cards (position ASC);

INSERT INTO public.home_carousel_cards (position, eyebrow, title, image_url, link_to, active) VALUES
  (1, 'Wellness · Coup de cœur', 'Ton moment bien-être', null, '/menu?gamme=wellness', true),
  (2, 'Shakes · Protéinés', 'Shake Mangue Passion', null, '/menu?gamme=shakes', true),
  (3, 'Coffee · Martinique', 'Coffee glacé maison', null, '/menu?gamme=coffee', true)
ON CONFLICT (id) DO NOTHING;
