-- Formulaire challenge 21 jours (14/09) : nb_personnes et souhait_info n'ont aucun sens pour un
-- challenge individuel (décision @user, 14/09 — voir docs/BRIEF-FORMULAIRE-CHALLENGE-2026-09-14.md).
-- Un formulaire dédié (Challenge21jRegistrationCard.tsx) reprend les questions de la fiche papier
-- de Catherine et n'envoie plus ces deux colonnes.
--
-- On NE les supprime PAS : les 6 autres types d'événement (ChallengeRegistrationCard.tsx, inchangé)
-- continuent de les écrire. On les rend NULLABLE — et on RETIRE LEUR DÉFAUT, sinon la base écrit
-- toute seule « Je viens seul » / « Non merci » dans des colonnes que Catherine lit — et on ajoute
-- les colonnes de la fiche.
ALTER TABLE public.event_registrations
  ALTER COLUMN nb_personnes DROP NOT NULL,
  ALTER COLUMN nb_personnes DROP DEFAULT,
  ALTER COLUMN souhait_info DROP NOT NULL,
  ALTER COLUMN souhait_info DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS age text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS timing_demarrage text,
  ADD COLUMN IF NOT EXISTS creneau_rappel text[];

-- ⚠️ Valeurs préexistantes : ne pas les lire comme des réponses.
-- nb_personnes / souhait_info portent soit le défaut fabriqué ('Je viens seul' / 'Non merci'),
-- soit l'ancien booléen ('1' / 'false'). Indistinguables d'une vraie réponse. Les 8 lignes
-- concernées (7 TEST-* + 1) sont dans le périmètre de purge.
COMMENT ON COLUMN public.event_registrations.nb_personnes IS
  '⚠️ Valeurs préexistantes NON fiables : défaut fabriqué ''Je viens seul'' OU ancien booléen ''1''. Ne pas lire comme une réponse.';
COMMENT ON COLUMN public.event_registrations.souhait_info IS
  '⚠️ Valeurs préexistantes NON fiables : défaut fabriqué ''Non merci'' OU ancien booléen ''false''. Ne pas lire comme une réponse.';

COMMENT ON COLUMN public.event_registrations.age IS
  'Challenge 21j uniquement. Facultatif : NULL = non répondu, ''non_renseigne'' = refus explicite (jamais une chaîne vide).';
COMMENT ON COLUMN public.event_registrations.profession IS
  'Challenge 21j uniquement. Champ libre ("Que fais-tu dans la vie ?"), suggestions via public/data/metiers-rome.json.';
COMMENT ON COLUMN public.event_registrations.timing_demarrage IS
  'Challenge 21j uniquement. Une des 3 valeurs de la fiche papier : ce_mois_ci / mois_prochain / en_savoir_plus.';
COMMENT ON COLUMN public.event_registrations.creneau_rappel IS
  'Challenge 21j uniquement. Un ou plusieurs créneaux parmi matin / midi / apres_midi / soir.';
