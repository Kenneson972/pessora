# RÉCAP — Test end-to-end Challenge 21 jours + lot "Mes bilans" (11/09/2026)

**Exécutant** : Claude (Playwright, sur production) · **Superviseur** : Ken
**Scénario suivi** : `docs/test-e2e-challenge-2026-09-11.md`

---

## 1. Résultat du test end-to-end

Parcours complet rejoué sur `www.pessora.fr` + `admin.pessora.fr`, préfixe `TEST-KEN`, nettoyé derrière.

| Étape | Résultat |
|---|---|
| ① Création challenge (admin) | ✅ Événement `type=challenge`, date +4j, inscriptions ouvertes par défaut |
| ② Deux créneaux (admin) | ✅ Rattachement automatique au challenge, sans SQL (`→ TEST-KEN Challenge 21 jours`) |
| ③ Parcours public — inscription | ✅ Étape **bilan** du questionnaire apparaît (nouveau, uniquement pour `type=challenge`) |
| ③ Bilan offert = "Oui" | ✅ Demande créée dans `bilan_bookings` (`slot_id=NULL`, `origine='questionnaire'`) |
| ③ Réservation par créneau | ✅ Message exact **"Ta demande de créneau est envoyée — Catherine te confirme rapidement"** (jamais "réservé"), créneau retiré de la liste, `disponible=false` |
| ④ Admin → onglet Demandes | ✅ Les deux demandes visibles, origine lisible (`Visiteur` / `Questionnaire`) |
| ⑤ Annulation membre | ✅ Vérifié par PATCH REST authentifié (même chemin RLS qu'un vrai bouton) : ligne → `annule`, créneau → `disponible=true` |
| ⑥ Notification e-mail | ⏭️ Non testé — lot ② (edge function) pas encore codé |
| ⑦ Nettoyage | ✅ Retour exact à la baseline (`events=1 / bilan_slots=7 / event_registrations=8 / bilan_bookings=0`), zéro trace `TEST-KEN` |

**Critère ⑨ validé** : `origine='questionnaire'` + `challenge_event_id` = l'événement de l'inscription, visible dans la file de Catherine avec origine lisible.

**Critère 2bis validé** (non-régression) : la réservation par créneau (parcours public habituel) continue de rendre 201 et de fermer le créneau — la garde `challenge_event_id IS NOT NULL AND type <> 'challenge'` laisse bien passer `NULL`.

### Piège d'outillage à noter (pas un bug produit)
Le MCP Supabase (`execute_sql`) n'exécute pas les blocs `DO $$ ... EXCEPTION WHEN OTHERS ... END $$` comme en session interactive — une exception levée dans le corps remonte comme erreur de la requête au lieu d'être absorbée. Tester les RPC une par une (`SELECT fn(...)`) plutôt qu'avec des scripts multi-statements à gestion d'erreur inline.

---

## 2. Gap trouvé pendant le test — et corrigé dans la foulée

**Constat** : `src/pages/member/MesBilans.tsx` existait dans le repo mais **n'était routé nulle part** dans `App.tsx`. Aucune page de l'espace membre ne permettait à un membre de voir ou d'annuler sa demande de bilan. Le correctif `user_id` de la RPC questionnaire (commit `11a8cdb`) suppose justement qu'un membre peut annuler depuis son espace — sans UI, cette garantie serveur restait invérifiable en pratique côté produit.

**Vérifié avant de coder** : le mécanisme serveur fonctionnait déjà (policy `bilan_bookings_update_own_cancel_only` + trigger `fn_bilan_booking_sync_slot`) — prouvé par un `PATCH` REST authentifié direct pendant le test (étape ⑤ ci-dessus). Il manquait uniquement le bouton.

**Corrigé** — branche `feat/route-mes-bilans-membre` (commit `4fa4efd`, **pushée, pas mergée**) :

- **Nouvelle route** `/mon-espace/bilans` (+ `/demo-espace/bilans`), lien **"Mes bilans"** ajouté dans la sidebar membre (`MemberLayout.tsx`, icône `Heart`, entre Événements et Commandes).
- **`MesBilans.tsx` réécrit** : conserve uniquement l'historique + l'annulation (déjà correcte). **Supprime entièrement** la section "Nouveau bilan" : elle insérait directement dans `bilan_bookings` puis basculait `bilan_slots.disponible=false` **côté client**, silencieusement bloqué par la RLS admin-only sur `bilan_slots` (bug connu, documenté dans l'en-tête de `BilanBookingWidget.tsx`). La réservation d'un nouveau bilan passe désormais uniquement par `BilanBookingWidget` (page du challenge), qui pose les garanties serveur (trigger, index unique, dédup).
- **Côté admin** : le bouton "Annuler" de `AdminBilans.tsx` (onglet Demandes) **existait déjà et fonctionne** — même policy admin `ALL`, même trigger de réouverture de créneau. Rien à ajouter, juste vérifié.

**Testé en local** (dev server) : route accessible, création d'une ligne de test, annulation cliquée dans l'UI (pas en direct SQL) → statut passe à "Annulé" sans rechargement, créneau associé redevenu disponible. Donnée de test nettoyée après coup.

---

## 3. État des branches à relire

| Branche | Commit | Contenu | État |
|---|---|---|---|
| `feat/rpc-questionnaire-bilan` | `8cd10dc`, `11a8cdb` | RPC `fn_create_bilan_booking_from_registration`, étape bilan réactivée, garde `trg_bilan_booking_guard_challenge_type`, `user_id` dans l'INSERT | Pushée. **Migration déjà appliquée en base par @alcyone** (vérifié : `prosrc` contient `user_id`, trigger `trg_bilan_booking_guard_challenge_type` présent et activé) |
| `feat/route-mes-bilans-membre` | `4fa4efd` | Route + page "Mes bilans" côté membre, nettoyage de `MesBilans.tsx` | Pushée, **pas mergée**, aucune migration associée (100% front) |

Aucune des deux n'a été mergée sur `main` — en attente de relecture équipe + recette QA, conformément à la règle "une branche par lot, aucun merge sans recette verte".
