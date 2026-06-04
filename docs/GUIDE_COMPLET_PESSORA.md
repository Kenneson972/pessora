# Guide complet PessÓra

*Guide d'utilisation du site et de l'espace de gestion.*
*Rédigé pour Catherine (gérante) et l'équipe du bar. Dernière mise à jour : 4 juin 2026.*

---

## Sommaire

1. [Introduction](#1-introduction)
2. [Espace client (public)](#2-espace-client-public)
3. [Espace admin](#3-espace-admin)
4. [Fonctionnement technique (expliqué simplement)](#4-fonctionnement-technique-explique-simplement)
5. [Dépannage](#5-depannage)
6. [Annexes](#6-annexes)

---

## 1. Introduction

### Qu'est-ce que PessÓra ?

PessÓra est un **bar à protéines** situé au Centre Commercial La Véranda – Cluny, à Fort-de-France (Martinique). Le site internet permet à vos clients de :

- Découvrir la **carte des boissons** (shakes protéinés, boissons énergie, boissons bien-être) ;
- Commander la **gamme de produits** (compléments et nutrition) ;
- S'inscrire à vos **événements** ;
- **Commander et payer en ligne**, puis venir récupérer leur commande au bar (Pick & Collect) ;
- Suivre l'avancement de leur commande **en temps réel** ;
- Créer un compte membre et, s'ils le souhaitent, s'abonner à **Óra+** pour bénéficier de réductions ;
- Prendre rendez-vous pour un **bilan bien-être** ;
- Poser leurs questions à **PessoBot**, l'assistant automatique du bar.

De votre côté, un **espace de gestion (admin)** vous permet de tout piloter : commandes, produits, événements, communication, etc.

### La technique en bref

Vous n'avez rien à installer. Tout fonctionne dans le navigateur. Pour information, le site repose sur :

- **React / Vite** — l'affichage du site ;
- **Supabase** — la base de données, les comptes et le temps réel ;
- **Stripe** — les paiements sécurisés par carte ;
- **Vercel** — l'hébergement du site.

### Accès

| Quoi | Adresse |
|------|---------|
| Site public | `https://www.pessora.fr` |
| Espace de gestion (admin) | `https://www.pessora.fr/admin` |
| Espace membre client | `https://www.pessora.fr/mon-espace` |
| Connexion | `https://www.pessora.fr/connexion` |

**Comment se connecter à l'admin :** allez sur `/admin`. Si vous n'êtes pas connectée, le site vous demande vos identifiants. Seuls les comptes ayant le **rôle administrateur** peuvent entrer dans l'espace de gestion ; un client normal qui tente d'aller sur `/admin` est refusé.

> **Note sur les comptes de démonstration.** En phase de développement, des adresses spéciales (`/demo-espace`) permettent de visiter l'espace membre sans se connecter, avec un faux compte (`demo@pessora.fr`). Ces adresses **ne fonctionnent qu'en développement** et sont désactivées sur le site en ligne.

[SCREENSHOT: page d'accueil complète du site pessora.fr avec le menu de navigation en haut]

---

## 2. Espace client (public)

Cette partie décrit ce que vos clients voient et font sur le site. Utile pour les accompagner par téléphone ou répondre à leurs questions.

### 2.1 Naviguer sur le site

Le menu en haut de page donne accès à toutes les rubriques : Accueil, Le Concept, Menu, Nos Produits, Événements, Contact. Un **panier** (icône sac) est toujours visible en haut à droite, ainsi qu'un accès à la **connexion / l'espace membre**.

[SCREENSHOT: barre de navigation du haut avec le logo, les liens de menu, l'icône panier et le bouton connexion]

**Comportement attendu :** le menu reste affiché sur toutes les pages publiques. Sur mobile, il se replie en un bouton « hamburger » (trois traits) qui ouvre le menu.

### 2.2 Le menu des boissons (le bar)

Adresse : `/menu`

La page Menu présente toutes les boissons du bar, classées par gamme (Wellness / bien-être, Énergie, Shakes). Des filtres permettent d'afficher une seule gamme à la fois. Certaines boissons portent un badge **Nouveauté** ou **Coup de cœur**.

**Pas à pas (côté client) :**

1. Cliquer sur **Menu** dans la barre du haut.
2. Choisir une gamme avec les filtres, ou faire défiler toute la carte.
3. Cliquer sur une boisson pour ouvrir sa **fiche détaillée**.

[SCREENSHOT: page Menu avec les filtres de gamme et la grille de boissons, dont une carte avec un badge "Coup de cœur"]

### 2.3 Fiche d'une boisson et options

Adresse : `/menu/:nom-de-la-boisson`

Sur la fiche d'une boisson, le client peut **personnaliser sa commande** avant de l'ajouter au panier, via une fenêtre d'options (`DrinkOptionsModal`) :

- **La taille** (petite / moyenne / grande) — le prix s'ajuste automatiquement ;
- **Le type de lait** (avoine, etc.) ;
- **Des boosters** (suppléments payants, ex. +1 € chacun) qui s'ajoutent au prix ;
- **La quantité.**

Pour les **membres Óra+ actifs**, le prix des boissons s'affiche avec la réduction (−50 %).

**Pas à pas :**

1. Sur la fiche, cliquer sur **Commander** / **Ajouter**.
2. Choisir taille, lait, boosters et quantité.
3. Cliquer sur **Ajouter au panier**. Une confirmation s'affiche brièvement.

[SCREENSHOT: fenêtre d'options d'une boisson avec le choix de taille, de lait, les boosters et le bouton "Ajouter au panier"]

### 2.4 La gamme de produits (compléments, nutrition)

Adresse : `/nos-produits`

La rubrique **Nos Produits** présente les gammes (par exemple Wellness, Sport, Skin). Chaque gamme a sa page (`/nos-produits/:gamme`) et chaque produit sa **fiche détaillée** (`/nos-produits/:gamme/:produit`).

Sur une fiche produit gamme, le client peut :

- Lire la description enrichie ;
- Choisir l'option **cuillère doseuse** quand le produit en propose une (une pastille de couleur indique la cuillère du produit) ;
- Ajouter le produit au panier ;
- Voir des produits associés (cross-sell).

> **Règle importante :** la gamme de produits est **réservée aux membres connectés**. Un visiteur non connecté peut mettre un produit gamme dans son panier, mais devra **créer un compte ou se connecter** pour finaliser la commande (le site le lui propose dans le panier). Cette règle est aussi vérifiée côté serveur, donc impossible à contourner.

[SCREENSHOT: fiche d'un produit de la gamme avec la description, l'option cuillère doseuse et le bouton d'ajout au panier]

### 2.5 Événements et inscriptions

Adresse : `/evenements` (liste) et `/evenements/:nom` (détail)

Le client consulte les événements à venir (pop-ups, partenariats…), lit le détail (date, lieu, point de rendez-vous, prix éventuel, places) et **s'inscrit** quand les inscriptions sont ouvertes. Après inscription, un petit questionnaire de bienvenue peut s'afficher.

**Pas à pas :**

1. Ouvrir **Événements**.
2. Cliquer sur un événement pour voir le détail.
3. Cliquer sur **S'inscrire** et remplir le formulaire.

**Comportement attendu :** un événement n'apparaît en ligne que si vous l'avez marqué « Visible en ligne » dans l'admin, et le bouton d'inscription n'apparaît que si « Inscriptions ouvertes » est activé.

[SCREENSHOT: page détail d'un événement avec la date, le lieu et le bouton "S'inscrire"]

### 2.6 Le panier

Le panier s'ouvre par un panneau latéral à droite (icône sac en haut). Il regroupe **boissons du bar et produits de la gamme** dans une même liste. Il est **conservé** même si le client ferme la page (mémorisé dans son navigateur).

Dans le panier, le client peut :

- **Augmenter / diminuer** la quantité d'une ligne (boutons + et −) ;
- **Supprimer** une ligne (icône corbeille) ;
- **Vider tout le panier** (avec une confirmation) ;
- Voir le **total**, le **temps d'attente estimé** et si le **bar est ouvert ou fermé**.

[SCREENSHOT: panier latéral ouvert avec deux articles, les boutons +/- de quantité, le total et le bouton "Payer ma commande"]

### 2.7 Commande sans compte (Guest Checkout)

Un client **non connecté** peut commander des **boissons du bar** sans créer de compte. Le panier lui demande seulement :

- son **nom** (au moins 2 caractères) ;
- son **téléphone** (format Martinique / France, ex. `06 XX XX XX XX` ou `+596…`).

Une fois ces champs valides, le bouton **Payer ma commande** s'active.

> Rappel : seuls les **produits du bar** sont commandables sans compte. Si le panier contient un produit de la **gamme**, le site invite à créer un compte avant de payer.

[SCREENSHOT: bas du panier avec les champs "Votre nom" et "06 XX XX XX XX" pour la commande invité]

### 2.8 Pick & Collect : choisir un créneau de retrait

Pour les **boissons du bar**, le client choisit un **créneau de retrait** dans le panier (`PickupTimePicker`). Les créneaux proposés sont calculés automatiquement à partir des **horaires d'ouverture du jour** (par tranches de 15 minutes). Le dimanche, aucune commande de retrait n'est proposée car le bar est fermé.

Pour les **produits de la gamme**, le client n'a pas à choisir d'heure : c'est **vous, en admin, qui planifiez la date de retrait** une fois la commande payée (voir la section Retraits Gamme).

**Comportement attendu :** si le panier contient des boissons et qu'aucun créneau n'est sélectionné, le paiement est bloqué avec le message « Veuillez sélectionner un créneau de retrait. »

[SCREENSHOT: sélecteur de créneaux de retrait dans le panier, avec des horaires de 15 en 15 minutes]

### 2.9 Le paiement Stripe

Quand le client clique sur **Payer ma commande**, il est redirigé vers une page de paiement sécurisée **Stripe** (en français). Il y saisit sa carte et valide.

**Ce qui se passe en coulisses :** au moment de cliquer, le site crée la commande en base au statut « en attente de paiement », puis ouvre la page Stripe. Les prix sont **revérifiés côté serveur** (le site ne fait jamais confiance au prix affiché côté navigateur), ce qui empêche toute fraude sur les montants.

[SCREENSHOT: page de paiement Stripe en français avec le récapitulatif de la commande et le formulaire de carte]

### 2.10 Page de confirmation de commande

Adresse : `/commande/succes`

Après un paiement réussi, le client revient sur une page de **confirmation**. Le panier est vidé automatiquement. La page affiche le récapitulatif et un **lien de suivi**. En cas de commande mixte (bar + gamme), les deux commandes issues du même paiement y sont affichées séparément.

[SCREENSHOT: page "Commande confirmée" avec la coche verte et le lien vers le suivi de commande]

### 2.11 Suivi de commande en temps réel

Adresse : `/suivi-commande`

Le client suit l'avancement de sa commande grâce à une **timeline** qui se met à jour **toute seule, en direct**. Il peut y accéder même sans compte, grâce à un **lien sécurisé** (jeton d'accès) reçu sur la page de confirmation.

Les étapes affichées dépendent du type de commande :

- **Bar :** Commande reçue → Paiement confirmé → En préparation → Prête → Retirée.
- **Gamme :** Commande reçue → Paiement confirmé → Retrait planifié → En préparation → Prête → Retirée.

[SCREENSHOT: page de suivi avec la timeline colorée des étapes de la commande]

### 2.12 Annulation de commande

Adresse : `/commande/annulee`

Si le client **abandonne le paiement** sur Stripe (bouton retour), il arrive sur la page « Commande annulée ». La commande reste alors **en attente de paiement** et n'est pas facturée.

Pour annuler une commande **déjà payée**, le client contacte le bar : c'est vous qui l'annulez depuis l'admin (voir section 3 et 5).

### 2.13 Créer un compte / se connecter

- **Inscription** : `/inscription`
- **Connexion** : `/connexion`
- **Mot de passe oublié** : `/reinitialisation-mot-de-passe`

Avoir un compte permet de retrouver son historique, suivre ses commandes, gérer son abonnement Óra+ et commander la gamme.

[SCREENSHOT: page de connexion avec les champs email / mot de passe et le lien d'inscription]

### 2.14 Espace membre : tableau de bord

Adresse : `/mon-espace`

Une fois connecté, le client dispose d'un espace personnel avec un menu latéral :

| Rubrique | Adresse | Contenu |
|----------|---------|---------|
| Tableau de bord | `/mon-espace` | Indicateurs (commandes, etc.), graphique sur 12 mois, prochains événements |
| Historique | `/mon-espace/historique` | Liste des commandes passées, détail par commande |
| Mes événements | `/mon-espace/evenements` | Inscriptions aux événements |
| Mes bilans | `/mon-espace/bilans` | Rendez-vous de bilan bien-être |
| Abonnement | `/mon-espace/abonnement` | Statut Óra+, prix, date de renouvellement, gestion |
| Profil | `/mon-espace/profil` | Coordonnées du compte |
| PessoBot | `/mon-espace/pessobot` | L'assistant intégré dans l'espace |

[SCREENSHOT: tableau de bord membre avec les indicateurs chiffrés et le menu latéral]

### 2.15 Bilan bien-être

Adresse : `/bilan-bien-etre`

Le client choisit une **date disponible** dans un calendrier puis un **créneau**, et réserve son bilan. Les disponibilités proviennent des créneaux que vous ouvrez. Un encart invite à découvrir l'abonnement Óra+.

[SCREENSHOT: page de prise de rendez-vous bilan avec le calendrier et les créneaux disponibles]

### 2.16 PessoBot (l'assistant automatique)

PessoBot est la **bulle de discussion** en bas à droite du site. Il répond aux questions courantes : horaires, adresse, différences entre les boissons, comment prendre un bilan, etc. Il s'adapte selon que le visiteur est un simple visiteur, un membre, ou un membre Óra+. Il peut aussi orienter le client vers le menu ou les événements.

[SCREENSHOT: bulle PessoBot ouverte avec un message d'accueil et des suggestions rapides cliquables]

### 2.17 Contact

Adresse : `/contact` (et `/contact-partenariat` pour les partenariats)

Un **formulaire** permet d'envoyer un message au bar (transmis par e-mail). Les coordonnées (adresse, horaires, téléphone) y sont aussi affichées.

[SCREENSHOT: page Contact avec le formulaire de message et les coordonnées du bar]

---

## 3. Espace admin

L'espace de gestion est l'endroit où vous pilotez le bar au quotidien. Toutes les pages sont protégées : il faut être connectée avec un compte administrateur.

### 3.1 Se connecter à l'admin

1. Aller sur `https://www.pessora.fr/admin`.
2. Si vous n'êtes pas connectée, saisir votre e-mail et votre mot de passe.
3. Vous arrivez sur la **Vue d'ensemble**.

Le menu de l'admin donne accès à : Vue d'ensemble, Commandes, Mode Bar, Retraits Gamme, Produits & Gammes, Contenu, Communication, Membres, Événements, Bilans.

[SCREENSHOT: écran de connexion admin puis vue d'ensemble avec le menu de gauche]

### 3.2 Vue d'ensemble (tableau de bord analytique)

Adresse : `/admin`

C'est votre tableau de bord. Le panneau **Analytics** affiche, sur les **7 derniers jours** :

- le **chiffre d'affaires** par jour ;
- le **nombre de commandes** ;
- les **produits les plus vendus** ;
- la **répartition bar / gamme** (camembert).

[SCREENSHOT: vue d'ensemble admin avec les graphiques de chiffre d'affaires, commandes et top produits]

---

### 3.3 Gérer les commandes du bar

Adresse : `/admin/commandes`

La page Commandes liste toutes les commandes. En haut, deux séries de **filtres** :

- **Type** : Tous / Bar / Gamme ;
- **Statut** : Toutes / En cours / En attente / Planifiées / En prépa / Prêtes / Terminées.

Une **barre de recherche** permet de retrouver une commande par nom. Les commandes les plus urgentes (payées, en préparation, prêtes) remontent automatiquement en haut de liste. La page se met à jour **en temps réel** : une nouvelle commande apparaît toute seule, avec un **son de notification**.

Chaque commande est une **carte** dépliable (icône 🥤 pour le bar, 🥗 pour la gamme) montrant le nom du client, son téléphone/e-mail, les articles, l'heure de retrait et un numéro de commande. En la dépliant, vous voyez le détail.

**Le cycle d'une commande bar :**

| Statut | Ce que ça veut dire | Bouton d'action |
|--------|---------------------|-----------------|
| En attente de paiement (*pending*) | Le client n'a pas encore payé | *(aucune action — paiement en cours)* |
| Payée (*paid*) | Le paiement est confirmé | **Préparer** → passe « En préparation » |
| En préparation (*preparing*) | La boisson se prépare | **Marquer prêt** → passe « Prêt » |
| Prêt (*ready*) | Le client peut venir chercher | **Retiré** → passe « Retiré » (clôture) |
| Retiré (*completed*) | Commande remise et terminée | *(aucune action)* |
| Annulé (*cancelled*) | Commande annulée | *(aucune action)* |

**Pas à pas pour traiter une commande bar :**

1. Repérer la commande payée (badge bleu « Payée »).
2. Cliquer sur **Préparer** quand vous commencez.
3. Cliquer sur **Marquer prêt** quand la boisson est faite.
4. Cliquer sur **Retiré** quand le client a récupéré sa commande (une confirmation s'affiche).

Vous pouvez aussi **supprimer** une commande (icône corbeille, avec confirmation). La suppression est tracée dans le journal d'audit.

[SCREENSHOT: page Commandes avec les filtres en haut et une carte de commande bar dépliée montrant les boutons d'action]

---

### 3.4 Mode Bar (vue cuisine / comptoir)

Adresse : `/admin/mode-bar`

Le **Mode Bar** est une vue plein écran sur fond sombre, pensée pour être affichée derrière le comptoir pendant le service. Elle n'affiche **que les commandes du bar** à traiter (payées, en préparation, prêtes).

Ce qu'elle apporte :

- Une **horloge en direct** et un **minuteur** par commande, qui démarre dès le début de la préparation. Au-delà de **15 minutes**, une **alerte rouge** signale le retard.
- Des **sons** lorsqu'une nouvelle commande arrive ou qu'un paiement est confirmé. *(Le son s'active au premier clic dans la page, à cause des règles des navigateurs — pensez à cliquer une fois en début de service.)*
- Une navigation entre commandes (barre latérale sur ordinateur, barre en bas sur mobile).
- Des **mises à jour instantanées** : quand vous cliquez sur une action, l'écran réagit tout de suite, et la base se synchronise en arrière-plan.

Les actions :

1. **Commencer la prépa** → la commande passe « En préparation » et le minuteur démarre.
2. **Marquer comme PRÊTE** → la commande passe « Prête ».

> En cas de coupure de la connexion temps réel, le Mode Bar **se resynchronise tout seul toutes les 10 secondes** : vous ne ratez aucune commande.

[SCREENSHOT: Mode Bar plein écran sur fond sombre avec une commande, son minuteur et le bouton "Commencer la prépa"]

---

### 3.5 Gérer les commandes de la gamme — Retraits Gamme

Adresse : `/admin/retraits`

Les produits de la gamme ne se préparent pas à la minute : ils se **planifient**. La page **Retraits Gamme** est un tableau de type Kanban à **4 colonnes**, mis à jour en temps réel, qui montre uniquement les commandes gamme payées :

| Colonne | Signification |
|---------|---------------|
| À planifier (*paid*) | Commande payée, en attente d'une date de retrait |
| Planifiées (*scheduled*) | Une date de retrait a été fixée |
| En préparation (*preparing*) | Le retrait se prépare |
| Prêtes (*ready*) | Le client peut venir chercher |

Chaque carte affiche le nom du membre, son téléphone/e-mail (cliquables), un lien vers sa fiche membre, les articles et le total.

**Planifier un retrait (depuis la colonne « À planifier ») :**

1. Sur la carte de la commande, choisir une **date** (au plus tôt le lendemain) et une **heure** (créneaux de 9 h à 18 h).
2. Cliquer sur **OK**. La commande passe en « Planifiées » avec sa date.

Le pipeline complet de la gamme compte **6 étapes** côté client : en attente de paiement → payée → planifiée → en préparation → prête → retirée. La page Retraits couvre les étapes de gestion du retrait ; le passage final « Retiré » se fait comme pour le bar.

> **Badge retard** : une commande dont la date de retrait planifiée est dépassée est signalée pour attirer votre attention.

[SCREENSHOT: tableau Retraits Gamme à 4 colonnes avec une carte en cours de planification (champ date + heure + bouton OK)]

---

### 3.6 Comprendre le « split » du panier (1 paiement = 2 commandes)

C'est un point important. Lorsqu'un client met **à la fois** une boisson du bar **et** un produit de la gamme dans le même panier :

- Il fait **un seul paiement** Stripe ;
- Mais le système crée **deux commandes distinctes** : une commande **bar** et une commande **gamme**, reliées par un même identifiant de paiement.

Pourquoi ? Parce que les deux n'ont pas le même circuit : le bar se prépare tout de suite avec un créneau de retrait, tandis que la gamme se planifie pour plus tard. Vous retrouverez donc :

- la partie **bar** dans **Commandes / Mode Bar** ;
- la partie **gamme** dans **Retraits Gamme**.

Sur la page de confirmation, le client voit lui aussi ses deux commandes séparément.

[SCREENSHOT: page de confirmation client affichant deux commandes (une bar, une gamme) issues d'un même paiement]

---

### 3.7 Gérer les produits et les gammes

Adresse : `/admin/produits-gammes`

Cette page comporte trois onglets : **Produits**, **Gammes**, **Boosters**.
*(Les anciennes adresses `/admin/produits` et `/admin/gammes` redirigent automatiquement ici.)*

#### Produits du bar (boissons)

Vous pouvez **ajouter, modifier, dupliquer et supprimer** des boissons, gérer leurs **images**, leurs **prix** et leurs **tailles** :

- **Prix par taille** : en cochant une case, vous saisissez **un seul prix** et les prix petite/grande se calculent automatiquement.
- **Édition du prix en un clic** : cliquez directement sur le prix dans la carte pour le modifier sur place.
- **Duplication** : le bouton copier crée une nouvelle boisson pré-remplie (tout sauf le nom), pratique pour des variantes.

[SCREENSHOT: onglet Produits avec la liste des boissons, l'édition de prix en ligne et le bouton dupliquer]

#### Produits de la gamme (compléments)

Pour la gamme, vous gérez **l'ajout, la modification, la suppression, le stock, les images et l'adresse web (slug)** de chaque produit.

[SCREENSHOT: onglet Gammes avec la fiche d'un produit en cours d'édition (image, stock, description)]

#### Galerie photos d'un produit

Chaque produit peut avoir **plusieurs photos**. La galerie (`AdminProductGallery`) permet d'ajouter ou de retirer des images, qui s'affichent ensuite sur la fiche produit.

[SCREENSHOT: gestionnaire de galerie d'un produit avec plusieurs vignettes photo]

#### Boosters

L'onglet **Boosters** gère les suppléments payants des boissons : nom, prix, description, gammes concernées (Wellness / Énergie / Shakes), ordre d'affichage et activation. Ce sont eux qui apparaissent dans les options d'une boisson.

[SCREENSHOT: onglet Boosters avec la liste des suppléments et le formulaire d'ajout]

---

### 3.8 Gérer les événements

Adresse : `/admin/evenements`

Vous **créez, modifiez et supprimez** les événements. Pour chaque événement (`EventForm`) :

- **Titre, adresse web (slug), type** (l'adresse web se remplit automatiquement à partir du titre) ;
- **Date, heure, lieu, point de rendez-vous** ;
- **Description** ;
- **Accès** : entrée libre ou payant (avec un prix) ;
- **Capacité maximale** (laisser vide = illimité) ;
- **Visible en ligne** : l'événement apparaît sur `/evenements` ;
- **Inscriptions ouvertes** : les visiteurs peuvent réserver ;
- **Pop-up** : possibilité d'afficher automatiquement une fenêtre d'annonce liée à l'événement.

**Inscriptions :** la liste des inscrits (`EventRegistrationsList`) se consulte par événement et peut être **exportée** (fichier à ouvrir dans un tableur).

**Galerie événement :** vous pouvez gérer les photos de l'événement.

[SCREENSHOT: formulaire de création d'événement avec les champs date, lieu, accès, et les interrupteurs "Visible en ligne" / "Inscriptions ouvertes"]

---

### 3.9 Communication : newsletter et annonces

Adresse : `/admin/communication`

Cette page réunit deux outils :

**Newsletter** — vous rédigez un message et l'**envoyez aux abonnés** de la newsletter. Vous pouvez aussi **exporter la liste** des abonnés.

**Annonces du site** — vous créez des annonces qui s'affichent sur le site sous forme de **pop-up** ou de **bandeau**. Pour chaque annonce : type (Coup de projecteur / Promo / Événement / Alerte), titre, sous-titre, message, image, bouton (libellé + lien), prix éventuel, date d'expiration, priorité, fréquence d'affichage et activation.

[SCREENSHOT: page Communication avec le composeur de newsletter et la liste des annonces du site]

---

### 3.10 Contenu de la page d'accueil

Adresse : `/admin/contenu`

Cette page comporte quatre onglets :

- **Infos bar** — l'adresse, les **horaires d'ouverture**, le contact et les infos de l'abonnement Óra+. C'est la **source unique** qui alimente le pied de page du site et PessoBot. *(Les créneaux de retrait du panier sont calculés à partir de ces horaires.)*
- **Carrousel** — les cartes éditoriales « À la une » de l'accueil. Vous pouvez **activer/désactiver** une carte, choisir sa **position** et lui mettre un **badge**.
- **Moments** — les sections « Choisis ton moment » (split gammes) de l'accueil.
- **Bannière** — la bannière de la page d'accueil.

[SCREENSHOT: page Contenu avec les onglets Infos bar / Carrousel / Moments / Bannière, sur l'onglet horaires]

> **Statut du bar (ouvert/fermé) et temps d'attente.** Le site affiche en direct si le bar est **ouvert ou fermé** et le **temps d'attente estimé**, dans le panier. Cette information vient d'un réglage en base mis à jour en temps réel.

---

### 3.11 Membres et abonnements Óra+

Adresse : `/admin/membres` (liste) et `/admin/membres/:id` (fiche)

La liste des membres vous donne accès à chaque **fiche membre**. Sur une fiche, vous consultez les informations Stripe, **l'abonnement Óra+** et l'historique du membre.

À propos d'Óra+ : c'est l'abonnement payant (≈ **24,90 €/mois**, sans engagement) qui donne **−50 % sur les boissons**, le bilan bien-être, l'accès privilégié aux événements, etc. Côté gestion, vous pouvez :

- **consulter** le statut de l'abonnement d'un membre ;
- **résilier** un abonnement ;
- ouvrir le **portail client Stripe** (où le membre gère lui-même sa carte / son abonnement) ;
- ouvrir un **portail admin** Stripe.

Le statut des abonnements se synchronise automatiquement avec Stripe (paiement réussi, échec, résiliation).

[SCREENSHOT: fiche d'un membre côté admin avec son abonnement Óra+ et l'historique de commandes]

---

### 3.12 Bilans

Adresse : `/admin/bilans`

Vous gérez ici les **créneaux et réservations** de bilans bien-être proposés aux clients sur la page `/bilan-bien-etre`.

[SCREENSHOT: page admin des bilans avec les créneaux et les réservations]

---

### 3.13 Booster PessoBot

Le comportement de l'assistant PessoBot s'appuie sur les **infos bar** (horaires, adresse, menu) et sur un **flux automatisé** (n8n). Les réglages liés à PessoBot se trouvent côté **Infos bar**. PessoBot dispose d'une protection contre les abus (limite du nombre de messages) et peut consulter le menu et les événements à venir pour répondre.

[SCREENSHOT: section de réglages PessoBot dans la page Infos bar]

---

### 3.14 Journal d'audit (traçabilité)

Les actions sensibles côté admin — changement de statut d'une commande, suppression, planification d'un retrait — sont **enregistrées dans un journal d'audit**. Cela permet de savoir qui a fait quoi et quand, en cas de doute.

---

## 4. Fonctionnement technique (expliqué simplement)

Cette partie explique « ce qui se passe derrière », sans jargon, pour vous aider à comprendre le système et à rassurer vos clients.

### 4.1 Le parcours d'une commande, étape par étape

Voici le chemin d'une commande, du panier jusqu'au retrait :

```
   CLIENT                          SYSTÈME                         VOUS (ADMIN)
   ------                          -------                         ------------
1. Remplit son panier
2. Choisit un créneau (bar)
   ou crée un compte (gamme)
3. Clique "Payer"      ───────►  Commande créée
                                 "en attente de paiement"
4. Paie sur Stripe     ───────►  Stripe confirme le paiement
                                 Commande passe "Payée"   ───────►  Apparaît dans Commandes
                                                                    (avec un son)
                                 ┌─ Bar ──────────────────────────► Mode Bar : Préparer → Prêt
                                 └─ Gamme ────────────────────────► Retraits : Planifier → Prêt
5. Suit en temps réel  ◄───────  Chaque changement de statut
   (page de suivi)               est renvoyé instantanément
6. Vient chercher      ◄───────  "Prête"               ◄────────── Vous marquez "Prêt"
7. Récupère sa commande                                ◄────────── Vous marquez "Retiré"
```

**Les statuts d'une commande :**

- **Bar** : en attente → payée → en préparation → prête → retirée.
- **Gamme** : en attente → payée → planifiée → en préparation → prête → retirée.

### 4.2 Pick & Collect : qui fait quoi

- **Le client** choisit son **créneau** pour les boissons du bar, directement dans le panier (créneaux calculés selon vos horaires).
- **Vous** traitez la boisson dans le **Mode Bar** et la marquez prête.
- Pour la **gamme**, c'est l'inverse : le client ne choisit pas d'heure, **c'est vous qui fixez la date de retrait** dans **Retraits Gamme** une fois la commande payée.

### 4.3 Stripe : ce que voit le client, ce qui se passe derrière

**Côté client :** une page de paiement sécurisée en français, où il saisit sa carte. C'est Stripe qui gère la carte — le site ne voit jamais le numéro de carte.

**Côté coulisses :**

1. Au clic sur « Payer », la commande est créée « en attente » et les **prix sont revérifiés côté serveur** (anti-fraude : impossible de payer moins en trafiquant la page).
2. Stripe encaisse, puis **prévient le site automatiquement** (un « webhook ») que le paiement est validé : la commande passe « Payée ».
3. Pour fiabiliser ce passage, le système a **plusieurs filets de sécurité** (la page de confirmation, la notification Stripe, et la vérification régulière côté admin). Résultat : une commande payée ne reste pas bloquée en « en attente ».
4. Le système est **idempotent** : si Stripe envoie deux fois la même notification, la commande n'est traitée qu'une seule fois (pas de double comptage).

### 4.4 Client invité ou membre : les différences

| | Client **invité** | **Membre** (compte) |
|---|---|---|
| Commander une **boisson du bar** | ✅ Oui (nom + téléphone) | ✅ Oui |
| Commander la **gamme** | ❌ Non (compte requis) | ✅ Oui |
| Suivre sa commande | ✅ Via un lien sécurisé | ✅ Dans son espace |
| Historique des commandes | ❌ Non | ✅ Oui |
| Abonnement **Óra+** et −50 % | ❌ Non | ✅ Oui |
| Bilan bien-être | ❌ Non | ✅ Oui |

En clair : un compte n'est **pas obligatoire** pour une boisson rapide, mais il est **nécessaire** pour la gamme et apporte de vrais avantages (suivi, historique, réductions).

---

## 5. Dépannage

### « Le paiement a échoué »

- Le client peut **réessayer** : sa commande est restée « en attente », rien n'a été facturé.
- Lui suggérer de **vérifier sa carte** (plafond, code, validité) ou d'essayer une autre carte.
- S'il a cliqué « retour » sur Stripe, il arrive sur la page « Commande annulée » : c'est normal, la commande n'est pas payée.

### « J'ai payé mais ma commande n'apparaît pas »

- Patientez quelques instants : le passage « payée » est automatique mais peut prendre un court délai.
- Côté admin, la page **Commandes** se rafraîchit toute seule (et au pire toutes les 10 secondes). Rechargez la page si besoin.
- Vérifiez le **bon filtre** : si vous êtes sur le filtre « Bar » et que la commande est une commande **gamme**, regardez dans **Retraits Gamme** (et inversement).
- Pour une commande **mixte**, rappelez-vous qu'elle est **scindée en deux** : une partie dans Commandes/Mode Bar, l'autre dans Retraits Gamme.

### « Comment annuler une commande ? »

- **Avant paiement** : il n'y a rien à faire, la commande « en attente » n'est pas facturée.
- **Après paiement** : depuis l'admin, vous passez la commande en **Annulé**. Pour un **remboursement**, l'opération se fait côté **Stripe** (portail). En cas de doute, suivez la procédure interne de remboursement.

### « Le son ne marche pas dans le Mode Bar »

C'est normal au tout début : les navigateurs n'autorisent le son qu'après un **premier clic** dans la page. **Cliquez une fois** n'importe où dans le Mode Bar en début de service, et les sons fonctionneront.

### « Un événement / un produit n'apparaît pas sur le site »

Vérifiez qu'il est bien **activé / visible en ligne** dans l'admin :

- Événement → interrupteur **« Visible en ligne »** (et **« Inscriptions ouvertes »** pour le bouton d'inscription).
- Produit / boisson → le produit doit être **actif**.
- Carte du carrousel d'accueil → la case **« Carrousel d'accueil »** doit être cochée.

### « Comment contacter le support ? »

Pour les questions clients : le formulaire `/contact` du site. Pour un souci technique du site lui-même, contactez votre prestataire (Karibloom) avec une **capture d'écran** et l'**heure** du problème — c'est ce qui aide le plus à le résoudre vite.

---

## 6. Annexes

### 6.1 Les fonctions serveur (Edge Functions) et leur rôle

| Fonction | Rôle |
|----------|------|
| `create-checkout-session` | Crée la commande et la session de paiement Stripe ; gère le « split » bar/gamme et la revérification des prix |
| `stripe-webhook` | Reçoit la confirmation de Stripe ; passe la commande « payée » ; gère les abonnements Óra+ ; idempotent |
| `update-order-status` | Met à jour le statut d'une commande (réservé aux admins) |
| `delete-order` | Supprime proprement une commande et ses articles |
| `get-order-by-token` | Affiche une commande via un lien sécurisé (suivi public) |
| `get-order-for-success` | Récupère la commande pour la page de confirmation |
| `send-newsletter` | Envoie la newsletter aux abonnés |
| `send-contact-email` | Envoie les messages du formulaire de contact |
| `create-subscription-session` | Démarre l'abonnement Óra+ (paiement récurrent) |
| `verify-subscription-session` | Vérifie un abonnement après paiement |
| `cancel-stripe-subscription` | Résilie un abonnement Óra+ |
| `get-stripe-member` | Récupère les infos Stripe d'un membre |
| `create-customer-portal-session` | Ouvre le portail Stripe du **client** |
| `admin-portal-session` | Ouvre le portail Stripe côté **admin** |

### 6.2 À propos de la base de données

Les informations sont rangées dans une base **Supabase** : commandes et articles, produits du bar et de la gamme, événements et inscriptions, membres et abonnements, annonces du site, contenus de l'accueil (carrousel, bannière, moments), statut du bar, journal d'audit, et suivi des paiements Stripe. Vous n'avez **pas besoin d'y toucher directement** : tout se gère depuis l'espace admin. La structure a évolué au fil d'une cinquantaine de mises à jour techniques (« migrations »), la plus récente datant de juin 2026.

### 6.3 Paiements de test (mode test Stripe)

Tant que le site n'est pas passé en **mode paiement réel**, les paiements utilisent le **mode test** de Stripe. Pour tester une commande de bout en bout **sans débiter une vraie carte**, on utilise une **carte de test Stripe** :

- **Numéro :** `4242 4242 4242 4242`
- **Date d'expiration :** n'importe quelle date future (ex. `12/34`)
- **CVC :** n'importe quels 3 chiffres (ex. `123`)
- **Code postal :** n'importe lequel

> Cette carte ne fonctionne **qu'en mode test**. En paiement réel, seules de vraies cartes sont acceptées. Le passage en paiement réel nécessite les **clés Stripe « live »** de la gérante (clé secrète, secret du webhook, identifiant de prix Óra+).

### 6.4 Contacts utiles

| Quoi | Coordonnées |
|------|-------------|
| Adresse du bar | C.C. La Véranda – Cluny, 97200 Fort-de-France, Martinique |
| Horaires | Lun–Ven : 9h30–18h · Sam : 10h30–14h · Dim : fermé |
| E-mail contact | contact@pessora.fr |
| E-mail / admin | pessora.fr@gmail.com |
| Site | https://www.pessora.fr |
| Prestataire technique | Karibloom |

*(Le numéro de téléphone public est à compléter dans l'admin → Contenu → Infos bar.)*

---

*Fin du guide. Pour toute évolution du site, ce document peut être mis à jour depuis l'espace de gestion ou par votre prestataire.*
