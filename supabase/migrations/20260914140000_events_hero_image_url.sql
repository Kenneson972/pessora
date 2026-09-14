-- CRUD challenge 21j : ajout d'une photo de hero éditable (demande @user, 14/09).
-- `image_url` existe déjà sur `events` (sert de vignette générique — page Événements,
-- rubrique dédiée challenge). Le hero de la landing (ChallengeHero.tsx) affichait jusqu'ici
-- une image codée en dur (/challenge-21j/hero-visuel.webp), aucune colonne ne le pilotait.
-- Nouvelle colonne dédiée : `hero_image_url`. Nullable — si vide, le composant garde le
-- visuel par défaut (pas de rupture visuelle tant que Catherine n'en a pas choisi un).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hero_image_url text;

COMMENT ON COLUMN public.events.hero_image_url IS
  'Challenge 21j uniquement. Photo plein cadre du hero (ChallengeHero.tsx). NULL = visuel par défaut du composant.';
