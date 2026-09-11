# TEST END-TO-END — Challenge 21 jours (Playwright, sous les yeux de Ken)

**But** : dérouler le parcours complet d'un vrai client sur le site en production, avec un challenge de test, et **tout nettoyer derrière**. Ken regarde l'écran.

**Date** : 11/09/2026 · **Exécutant** : Claude (Playwright) · **Superviseur** : Ken

---

## 0. RÈGLES AVANT DE COMMENCER

- **Tout ce qu'on crée est préfixé `TEST-KEN-`** → identifiable et purgeable (`TEST-%` = 0 après nettoyage).
- **On teste sur la production** (`https://www.pessora.fr` + `https://admin.pessora.fr`) : c'est le seul endroit où le parcours est réel.
- **Identifiants admin** : à lire **à l'exécution** depuis le fichier de secrets (jamais dans le code, jamais dans un chat). Compte actuel : `admin@pessora.mq`.
- **Aucun e-mail réel ne doit partir chez la cliente** : vérifier AVANT que `ADMIN_EMAIL` pointe sur la boîte de test (`ken972@yopmail.com`). Si ce n'est pas le cas → **STOP**, on rebascule d'abord.
- **Sauvegarde de l'état** : noter le nombre d'événements / créneaux / inscriptions **avant** (attendu aujourd'hui : `events` 1 · `bilan_slots` 7 · `event_registrations` 8 · `bilan_bookings` 0).

---

## 1. CRÉER LE CHALLENGE (admin)

1. Se connecter à `admin.pessora.fr` avec le compte admin.
2. Aller dans **Événements** → **Créer**.
3. Remplir :
   - **Type** : `Challenge 21 jours`
   - **Titre** : `TEST-KEN Challenge 21 jours`
   - **Date** : **aujourd'hui + 4 jours** (indispensable : la fenêtre des créneaux s'ouvre à **J-14** et se ferme au jour J — une date à +4 j rend les créneaux réservables **tout de suite**)
   - **Inscriptions ouvertes** : oui
4. Enregistrer. **Vérifier** que l'événement apparaît dans la liste.

**Critère** : l'événement existe, type `challenge`, date à +4 j.

**1bis. Ouvrir les inscriptions sur ce challenge de test** (`registration_open`) — sinon l'étape 3 ne peut pas se faire, et on croira à un bug du formulaire. ⚠️ C'est un **état à emporter avec la suppression du challenge** (étape 7) : un `TEST-KEN` laissé **ouvert aux inscriptions** apparaîtrait dans la page **Événements** publique. Si le test s'interrompt, on nettoie **à la main avant tout partage d'écran** — on ne montre pas à Catherine un onglet où traîne `TEST-KEN`.

---

## 2. CRÉER DEUX CRÉNEAUX (admin)

1. Dans **Bilans / Créneaux**, ajouter **deux créneaux** sur des jours dans la fenêtre (ex. demain 10h00 et demain 14h00).
2. **Vérifier l'affichage de l'état** : chaque créneau doit indiquer son rattachement au challenge (`→ TEST-KEN Challenge 21 jours`). S'il affiche « orphelin / ne s'affichera pas », le rattachement automatique n'a pas fonctionné → **noter et s'arrêter là**.

**Critère** : 2 créneaux, rattachés automatiquement au challenge créé (sans intervention SQL).

---

## 3. LE PARCOURS PUBLIC (la partie que Ken veut voir)

Sur `https://www.pessora.fr`, **sans être connecté** (fenêtre de navigation privée) :

1. Aller dans **Événements** → le challenge `TEST-KEN …` apparaît.
2. Cliquer dessus → la page du challenge s'ouvre, avec **les créneaux de bilan visibles**.
3. **S'inscrire** : nom `TEST-KEN`, prénom `Playwright`, téléphone `0696000099`.
4. Le questionnaire s'ouvre :
   - l'étape **bilan** doit être proposée (**c'est nouveau** : elle n'apparaît que pour un challenge) ;
   - répondre **« Oui, je souhaite profiter du bilan offert »** ;
   - répondre à l'objectif.
5. **Réserver un créneau** : choisir le créneau de 10h00.
6. **Vérifier** que le créneau **disparaît de la liste** (ou passe « indisponible ») après la réservation.
7. Le message affiché doit être **« demande envoyée — Catherine vous confirmera »** — **jamais « réservé »** (la validation est manuelle).

**Critères** : inscription OK · étape bilan présente · demande envoyée · créneau retiré de la liste.

---

## 4. VÉRIFIER DANS SON ADMIN (la file de Catherine)

1. Retour dans l'admin → **Bilans** → onglet **Demandes**.
2. **La demande doit y être** : `TEST-KEN Playwright`, téléphone `0696000099`, **origine = questionnaire**, rattachée au **challenge TEST-KEN**.

**Critère** : la demande est visible dans la file, avec son origine lisible. *(C'est la promesse du CR : « on n'a pas promis une réservation, on a promis que sa file reçoit la demande ».)*

⚠️ **Attendre DEUX lignes, pas une** : la demande **sans créneau** (le questionnaire — origine `questionnaire`) **et** la réservation **sur créneau**. Ce n'est **pas un échec du test** : la personne apparaît deux fois parce qu'elle a exprimé **deux intentions réelles** (`je veux un bilan` / `je veux un bilan à CE moment-là`). C'est du **bruit connu**, dont la résolution est une **décision produit en attente** (la réservation de créneau devrait *supplanter* la demande sans créneau de la même personne). ➡️ **Étape 7 : supprimer les DEUX lignes.**

---

## 5. TESTER L'ANNULATION (le correctif `user_id`)

1. Se connecter sur le site avec **un compte membre** (le compte QA d'Alcyone, ou celui de Ken).
   ⚠️ L'inscription du test doit alors porter **ce compte** dans `user_id` — sinon l'annulation ne s'écrira pas (invité = non annulable, c'est voulu).
   🔴 **Donc DEUX variantes à jouer, et la première n'est pas un échec** : **(a) invité** (navigation privée) → la demande existe, et **elle n'est pas annulable** : c'est la propriété voulue, on le **note** au lieu de le compter comme un bug ; **(b) connecté en membre, inscription faite CONNECTÉ** → on vérifie les **deux** effets ci-dessous. **Seule (b) prouve le correctif `user_id`** — et si l'étape 3 a été jouée en invité, il faut **refaire une inscription connectée** avant de conclure.
2. Espace membre → **Mes bilans** → **Annuler** la demande.
3. **Vérifier les DEUX effets** (jamais le message de l'écran) :
   - la ligne passe bien en `statut = 'annule'` ;
   - **le créneau redevient réservable** (il réapparaît côté public).

**Critère** : annulation écrite **ET** créneau rouvert. *(Sans le correctif `user_id`, l'interface disait « Annulé » sans rien écrire et le créneau restait fermé.)*

---

## 6. LE BALAYAGE E-MAIL (⚠️ après le lot ②)

**Prérequis** : la fonction de notification doit être codée (lot ② — balayage 15 min, `statut='en_attente' AND notified_at IS NULL`, marquage **sur succès**).

1. **Vérifier avant** : `ADMIN_EMAIL` pointe sur **`ken972@yopmail.com`** (boîte de test) — pas sur la cliente.
2. Créer **une** nouvelle demande de bilan (refaire l'étape 3).
3. **Attendre un passage du balayage** (≤ 15 min).
4. **Vérifier la boîte de test** : **un e-mail**, avec :
   - **le nom du demandeur dans l'objet** ;
   - nom, prénom, téléphone, origine de la demande ;
   - **le bouton vers sa file** dans l'admin.
5. **Vérifier l'anti-doublon** : au balayage suivant, **aucun second e-mail** pour la même demande.

**Critères** : 1 demande = 1 e-mail · le 2ᵉ passage n'envoie rien · l'e-mail porte **l'action** (le bouton), pas seulement l'information.

---

## 7. NETTOYAGE (obligatoire — on ne laisse rien chez la cliente)

Supprimer, dans cet ordre :
1. les **réservations de test** (`TEST-KEN`) ;
2. les **2 créneaux** créés ;
3. **l'inscription** `TEST-KEN Playwright` ;
4. **le challenge** `TEST-KEN Challenge 21 jours`.

Puis **vérifier le retour à l'état de départ** :
- `events` = **1** · `bilan_slots` = **7** · `event_registrations` = **8** · `bilan_bookings` = **0**
- **`TEST-%` = 0** dans les quatre tables.

**Et figer une empreinte de sortie** : `python3 /opt/data/cache/base_fingerprint.py --snapshot post-test` → le `--diff` ne doit montrer **que** la colonne `notified_at` (si le lot ② est passé), rien d'autre.

---

## CE QUE CE TEST PROUVE (et ce qu'il ne prouve pas)

**Il prouve** : le parcours réel d'un client, sur la production, de l'inscription jusqu'à la file de Catherine — y compris l'étape bilan (nouvelle), le retrait du créneau, l'annulation, et l'e-mail de notification.

**Il ne prouve pas** : la charge (plusieurs clients simultanés se teste autrement, et c'est déjà recetté par les tests de concurrence du lot A).
