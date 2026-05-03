-- PESSORA — PessoBot S1 (Fondations)
-- 1. Table `bar_settings` : adresse / horaires / contact (éditables depuis /admin)
-- 2. Vue `v_pessobot_menu` : catalogue simplifié consommé par n8n
-- Prérequis : public.is_admin(), public.set_updated_at()

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Table bar_settings (single-row pattern via CHECK id=1)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bar_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  hours   jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bar_settings IS
  'Configuration bar (adresse, horaires, contact). Single-row (id=1). Éditable depuis /admin/infos.';

-- Seed initial (valeurs issues de src/data/infoData.ts)
INSERT INTO public.bar_settings (id, address, hours, contact)
VALUES (
  1,
  jsonb_build_object(
    'street', 'C.C. La Véranda - Cluny',
    'city', 'Fort-de-France',
    'postal_code', '97200',
    'country', 'Martinique',
    'full', 'C.C. La Véranda – Cluny, 97200 Fort-de-France, Martinique',
    'maps_url', ''
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'Lundi - Vendredi', 'value', '9h30 - 18h'),
    jsonb_build_object('label', 'Samedi',           'value', '10h30 - 14h'),
    jsonb_build_object('label', 'Dimanche',         'value', 'Fermé')
  ),
  jsonb_build_object(
    'email',          'pessora.mq@gmail.com',
    'phone',          '',
    'instagram',      '@pessora.mq',
    'instagram_url',  'https://www.instagram.com/pessora.mq/'
  )
)
ON CONFLICT (id) DO NOTHING;

-- RLS : lecture publique (footer, PessoBot, pages publiques), écriture admin uniquement
ALTER TABLE public.bar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bar settings" ON public.bar_settings;
CREATE POLICY "Public read bar settings"
  ON public.bar_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin update bar settings" ON public.bar_settings;
CREATE POLICY "Admin update bar settings"
  ON public.bar_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pas de policy INSERT/DELETE : on garde toujours exactement une ligne (seedée ci-dessus).

DROP TRIGGER IF EXISTS bar_settings_updated_at ON public.bar_settings;
CREATE TRIGGER bar_settings_updated_at
  BEFORE UPDATE ON public.bar_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Vue v_pessobot_menu : catalogue simplifié pour n8n
--    security_invoker = on → respecte la RLS de public.products (lecture publique)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_pessobot_menu
WITH (security_invoker = on) AS
SELECT
  p.slug,
  p.name,
  p.category,
  p.price,
  p.calories,
  p.protein,
  p.description,
  p.pitch,
  p.ingredients,
  p.benefits,
  p.badges,
  p.image_url
FROM public.products p
WHERE p.active = true
ORDER BY p.category, p.carousel_sort NULLS LAST, p.name;

COMMENT ON VIEW public.v_pessobot_menu IS
  'Catalogue produit simplifié (actif uniquement) consommé par PessoBot via n8n.';
