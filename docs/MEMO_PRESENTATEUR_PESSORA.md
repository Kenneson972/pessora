# Mémo présentateur — PessÓra (toi)

**Deck** : `~/Downloads/pessora_presentation_gerant_2026_20260504151302.pdf` (**15 slides**).  
**Doc long** (détail métier) : `docs/PRESENTATION_GERANT_PESSORA_2026-05.md`.

---

## Avis rapide sur ce PDF (pour toi)

**Ce qui fonctionne bien**

- **Fil narratif logique** : vision → temps → expérience (mobile) → membre → commandes → pilotage (membres / événements) → paiements → assistant → synthèse. C’est exactement le déroulé qu’un gérant peut suiver sans jargon.
- **Formulations** : *« L’expérience premium jusque sur smartphone »*, *« Votre assistant nourri aux bonnes sources »* — **premium**, pas techno ; ça colle à la marque.
- **Volume** : 15 slides = raisonnable pour 20–35 min avec discussion.

**À corriger avant un envoi “final”**

- L’extraction du PDF montre **« Slide Content »** sur plusieurs numéros (3, 4, 8, 12, 14, 15). Soit le modèle a laissé des **titres génériques**, soit le texte est en **image** (non copiable). Ouvre le PDF : si tu vois encore “Slide Content” ou des blocs vagues, **remplace** par de vrais titres + 3–5 puces (tu peux pomper dans `PRESENTATION_GERANT_PESSORA_2026-05.md`).
- **Slide 1** : ajoute en sous-titre *qui / quand* (ex. restitution Karibloom — mai 2026) pour **cadrer** la réunion.
- Pense à une slide **« Suites / questions »** si 14–15 sont encore vierges — évite de finir sur du vide.

**Note technique** : fichier produit avec **pypdf** ; pas grave, mais vérifie la **mise en page** (polices, débordements) sur un autre PC / tablette.

---

## En 30 secondes avant d’entrer

- Message : **image, membre, admin, commandes, paiements, bot** — tout a été **consolidé** récemment ; le **tableau de bord** et les **paiements** sont **plus alignés sur la réalité**.
- Éviter : **API, webhook, Edge Function** → **traitement automatique, base produits, sécurisation**.
- **Jamais** à l’écran : clés Stripe, secret bot, tokens.

---

## Plan aligné sur ton PDF (15 slides) + notes d’oral

| # | Titre tel que dans le PDF | Dis-moi / note présentateur |
|---|---------------------------|------------------------------|
| **1** | Vision d’ensemble des améliorations digitales PessÓra | Une phrase : **digital au service du bar + des membres**, pas l’inverse. Pas de liste technique ; annoncer les **grands blocs** (site, membre, commandes, admin, paiements, bot). |
| **2** | Timeline des évolutions PessÓra | **Deux temps** : fin avril (événements, bilans, bot, inscriptions) → début mai (commandes + créneaux, Stripe, produits, accueil). |
| **3** | *Slide Content* (à vérifier sur ton export) | Si vide : insérer **Site public & image** — accueil, gammes + fiches, menu tailles, Óra+, contact. |
| **4** | *Slide Content* (à vérifier) | Si vide : **Détail produits / parcours d’achat** ou **Óra+ & confiance** (CTA après avantages, pages après paiement). |
| **5** | L’expérience premium jusque sur smartphone | **Touch targets**, contrastes, libellés explicites (ex. « Menu » pas icône seule), images dimensionnées, nav membre avec **Bilans**. |
| **6** | Espace membre PessÓra | **Bilans** intégrés, **moins de répétition Óra+** si déjà abonné, **commandes + créneau + statuts** visibles. |
| **7** | Système de commandes PessÓra | Client **choisit un créneau** ; **vous** suivez payé → préparation → prêt → retiré ; même langage **cuisine / accueil**. |
| **8** | *Slide Content* (à vérifier) | Si vide : **Tableau de bord admin** — chiffres réels, liste membres fiable, file commandes **sans faux KPI**. |
| **9** | Membres et événements sous contrôle | **Fiche membre** (abonnement, portail si besoin), **événements** multi-photos, inscriptions publiques réparées, **infos bar** pour site + bot. |
| **10** | Sécurité et fiabilité des transactions | **Prix = base produits** au paiement ; **pas de double traitement** si Stripe renvoie deux fois ; **moins de données perso** inutiles ; **statuts** clairs. Ne pas montrer de secrets. |
| **11** | Votre assistant nourri aux bonnes sources | **Une source de vérité** (infos bar dans l’admin) ; échange **signé** avec l’automation — dire le **bénéfice** (cohérence + protection), pas l’architecture. |
| **12** | *Slide Content* (à vérifier) | Si vide : **Qualité perçue / design** — direction **premium éditorial**, pas “site générique” ; éventuellement rappel **grilles pro** = marge de progrès **normale**. |
| **13** | Synthèse des bénéfices PessÓra | Utiliser les **5 phrases** ci-dessous (ou les puces de ta slide si déjà rédigées). |
| **14** | *Slide Content* (à vérifier) | **Suites possibles** (email contact prod, raffinements UX, contenus à tenir à jour) — optionnel. |
| **15** | *Slide Content* (à vérifier) | **Merci + échanges** ; contact pour questions **hors réunion**. |

---

## Version express 10 minutes (si tu presses)

Slides **1 → 2 → 7 → 10 → 11 → 13** : vision, temps, commandes, paiements sûrs, bot, synthèse. Mentionne **5** et **6** en une phrase chacune (« mobile et membre, même exigence premium »).

---

## Les 5 phrases de clôture (slide 13 ou prise de parole)

1. Le site public est **plus complet** et **aligné** sur l’offre.  
2. L’espace membre **porte** bilans et commandes **proprement**.  
3. L’admin **reflète l’activité réelle** et **édite** mieux événements et produits.  
4. Paiements et suivi sont **plus sûrs** et **lisibles** pour l’équipe et le client.  
5. L’assistant **s’appuie sur les bonnes infos** et un canal **mieux protégé**.

---

## FAQ express (identique au fond, version slide 10–11)

| Question | Réponse |
|----------|---------|
| Prix falsifiable ? | **Non** : validation sur la **base produits** au moment du paiement. |
| Double notification banque ? | **Traitement une fois** grâce au suivi des événements. |
| Après paiement ? | **Payé → préparé → prêt → retiré** ; créneau visible. |
| Chiffres admin ? | **Membres, Óra+ / gratuit, événements, commandes** — plus de courbes **factice**. |
| Bot invente ? | Il s’appuie sur **ce que vous saisissez** (infos bar) ; **une source** pour tout le monde. |

---

## Checklist avant la réunion

- [ ] Ouvrir le PDF : **aucune** slide ne reste sur « Slide Content » ou titre générique.  
- [ ] **Aucune** capture avec clés / tokens / données clients lisibles.  
- [ ] Copie de secours : export PDF sur téléphone ou clé USB.  
- [ ] Option : imprimer **slides 2, 7, 10, 13** en mode **notes** pour toi seul.

---

## Fichiers utiles (toi seul)

| Fichier | Usage |
|---------|--------|
| `docs/PRESENTATION_GERANT_PESSORA_2026-05.md` | détails + prompt si tu refais le deck |
| `docs/ACTIONS_LOG.md` | preuve des livraisons |
| `docs/AUDIT_STRIPE_2026-05-03.md` | creux technique **après** la réunion |

*Mémo réaligné sur ton export PDF — mai 2026.*
