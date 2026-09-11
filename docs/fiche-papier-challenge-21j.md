# Fiche papier PESSORA — « Quel est ton prochain objectif ? »

**Source** : photo WhatsApp de Kenneson, 09/09/2026 (retranscrite le 11/09/2026).
**Origine** : le document que Catherine utilise au bar pour recruter les participantes du Challenge 21 jours.
**Pourquoi ce fichier** : la fiche n'existait que dans une discussion et dans gbrain (qui s'écrase). Elle est désormais **dans le repo**, versionnée.

---

## Transcription intégrale du document

**PESSORA**
**QUEL EST TON PROCHAIN OBJECTIF ?**

### TES INFORMATIONS
Nom : ____________ Prénom : ____________
Âge : ______ Téléphone : ____________
Que fais-tu dans la vie ? ____________________

### TON BILAN BIEN-ÊTRE
☐ Je souhaite réaliser un bilan bien-être

**Mon objectif :**
☐ Perte de poids
☐ Prise de masse / tonification
☐ Plus d'énergie
☐ Reprendre de bonnes habitudes

### CHALLENGE 21 JOURS
☐ Je souhaite participer au **Challenge 21 jours**

**Inclus :** Application **GetFitNow** · communauté **24FIT PESSORA** · séances de sport · idées recettes · conseils & accompagnement · suivi de tes objectifs.

**Quand souhaites-tu commencer ?**
☐ Ce mois-ci
☐ Le mois prochain
☐ Je souhaite en savoir plus

### COMPLÉMENT DE REVENUS  ⚠️ HORS SITE
**Et si PESSORA pouvait aussi t'apporter une opportunité financière ?**
☐ Oui, je souhaite découvrir l'opportunité Herbalife et en savoir plus sur le complément de revenus
☐ Pas pour le moment

### QUAND PEUT-ON TE RECONTACTER ?
☐ Matin
☐ Midi
☐ Après-midi
☐ Soir

*En laissant mes coordonnées, j'accepte d'être recontacté(e) par l'équipe PESSORA concernant les sujets cochés ci-dessus.*

---

## Ce qu'on en fait (et ce qu'on n'en fait PAS)

### ✅ Ce qui alimente la page `challenge` du site
- **Les 6 éléments inclus** (app GetFitNow, communauté 24FIT PESSORA, séances de sport, idées recettes, conseils & accompagnement, suivi des objectifs) → **c'est le contenu qui manquait** au bloc « ce que tu obtiens ». Il vient **d'elle**, il n'est pas inventé.
- **Les 4 objectifs** (perte de poids · prise de masse/tonification · plus d'énergie · reprendre de bonnes habitudes) → réutilisables pour le parcours bilan/inscription.
- **Les 3 timings** (ce mois-ci · le mois prochain · en savoir plus) → utiles pour l'inscription au challenge.
- **Les 4 créneaux de rappel** (matin/midi/après-midi/soir) + **la clause de consentement** → modèle pour le formulaire (RGPD).

### 🔴 Ce qui NE VA PAS sur le site
- **La section « COMPLÉMENT DE REVENUS » (opportunité Herbalife).** C'est du **recrutement de distributeurs** : la règle du projet est que **le site fait la vente, il ne fait pas le recrutement** — Catherine gère cette partie en présentiel. À exclure de toute page publique.
  *(Rappel Herbalife : le « système VIP » = programme client Wellness Rewards, à ne **jamais** présenter comme une opportunité de business. Ici, c'est explicitement l'opportunité distributeur — donc hors site.)*

  > ⚠️ **À écrire partout où on utilise cette fiche** : *« cette section reste au bar, avec Catherine — elle n'entre pas dans le site »*. Sinon, dans six mois, quelqu'un ouvrira ce document, verra la section « manquante » et la rajoutera de bonne foi sur une page publique et commerciale.

### ⚠️ La clause de consentement ne se recopie PAS telle quelle
La fiche dit : *« j'accepte d'être recontacté(e) par l'équipe PESSORA concernant **les sujets cochés ci-dessus** »*. Or « ci-dessus » **inclut le complément de revenus Herbalife** — donc la recopier ferait consentir le visiteur à une finalité qu'on ne publie pas, et **mélangerait plusieurs finalités dans une seule case**. Trois adaptations obligatoires pour la version en ligne :

1. **Consentement explicite et séparé**, avec **uniquement les finalités du site** : bilan · challenge · recontact. **Jamais l'opportunité financière.**
2. **La newsletter est une finalité distincte** → sa **propre case**, jamais noyée dans le consentement de contact.
3. **Le champ « Âge »** : le papier s'en passait, pas un formulaire public → prévoir la règle qui va avec (âge minimum, ou consentement parental pour un mineur).

### ℹ️ Le gribouillage
Le paraphe au stylo bleu en bas à droite de la photo est **une initiale tracée en boucle** — aucune information exploitable (ni prix, ni date, ni nom). Confirmé par Kenneson. **Rien à en tirer.**

### 🟡 Décision antérieure à réconcilier
La fiche RDV de septembre (`gbrain`, `clients/pessora-rdv-2026-09.md`) prévoyait une table dédiée **`challenge_leads`** pour capturer cette fiche en ligne :
`nom, prenom, age, telephone (canonique), email (obligatoire, pour les relances Resend), metier, objectifs[], timing, opportunite_herbalife (bool), creneau, consentement_rgpd, vague/session, statut, bilan_booking_id, created_at`.

**Cette table n'a pas été construite** : le lot A du 10/09 a implémenté le parcours **événement + bilan** (`events.type='challenge'`, `bilan_bookings`, `event_registrations`). Les deux approches ne se contredisent pas — **la fiche papier est un outil de prospection au bar**, le site est le parcours en ligne. À trancher si on veut, un jour, saisir ces fiches dans l'admin.

⚠️ **Et le mot « vague » de cette ancienne liste est de NOUS, pas de Catherine** — vérifié : sa fiche n'emploie que **« Challenge 21 jours »**, avec ses trois timings (« ce mois-ci · le mois prochain · je souhaite en savoir plus »). Dans **tout ce qui est publié** — page, visuel, e-mail client, libellé d'admin — on dit **« Challenge 21 jours »**, **jamais « vague »** (règle de vocabulaire dans `docs/CONSIGNES-CLAUDE.md`).

---

## À FAIRE À LA REMISE
- Demander à Catherine si elle veut que **la fiche papier soit reprise en formulaire web** (ou si elle reste un outil bar).
- Récupérer ses **photos avant/après** et ses **vrais chiffres** (participants, résultats) — **jamais de contenu inventé** sur la page.
