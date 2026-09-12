# CONSIGNES À CLAUDE — Pessora

**Ce fichier est le point d'entrée unique.** Toute consigne destinée à Claude y est écrite par l'équipe (Nova, Alcyone, Vela, Élise), avec sa date et son état. Rien ne se transmet par chat : ce qui n'est pas ici n'est pas une consigne.

> **Pour Ken :** « pull, lis `docs/CONSIGNES-CLAUDE.md` » — il a tout.
> **Pour Claude :** lis ce fichier en entier avant de coder. Il fait autorité sur les briefs plus anciens quand les deux se contredisent.

---

## 🎯 REPRISE ICI — ordre du jour du 12/09 (lire en premier)

**Branche de travail : `feat/challenge-21j-landing`** — **19 commits déjà poussés** (dernier : `f1eafd9`), `tsc` propre, 30 tests verts (les 10 échecs `cartStore` sont préexistants). **Ne pas repartir de zéro — on FINIT ce qui est commencé.**

### 1. Finir la page Challenge — **état au 12/09, après le push `4048075`**

**✅ FAIT — et re-vérifié dans le code, pas sur parole** (@elise, puis **@nova indépendamment**) :
- **La porte 8 est fermée POUR LE BOUTON** : `ChallengeLanding.tsx:29` → `const isPast = event.date < todayInMartinique()` — **le helper du fuseau**, pas `toISOString()`, et **un challenge du jour reste ouvert** ✅ — puis `l.40` bascule `<ChallengeEndedState />` au lieu de `<ChallengeRegistrationCard />` ✅.
- **« vague » : 0 occurrence** ✅ · **« Places limitées » : 0** ✅.
- **Le lien « politique de confidentialité »** est passé en `text-black/70 underline` (7,57:1) ✅ — la demande d'@lyra.
- **L'emplacement des 6 bannières** est posé (`ChallengeProgramCard`, +39 lignes), dégradé de repli, **aucun pointillé** ✅.

**⚠️ RESTE — dans cet ordre :**

1. **🔴 Le sélecteur de timings ment encore sur un challenge terminé** — c'est **la porte 8, un cran plus loin** (le point d'@lyra : « la rangée de timings ment aussi »). `ChallengeProgramCard.tsx` **ne reçoit aucune prop** et rend `TIMINGS` (**l.16** la constante, **l.72** le rendu) **inconditionnellement** : sur l'état passé, le visiteur venu d'un vieux lien lit toujours « **Quand souhaites-tu commencer ?** » sous l'encadré. → passer l'état (**prop `isPast`**) et **retirer le sélecteur du DOM** (pas le masquer en CSS) — **les 6 inclus restent**, c'est ce que le visiteur est venu voir.
2. **⏱️ Le minuteur n'est pas commencé** : `ChallengeCountdown.tsx` n'existe pas et `martiniqueDate.ts` **n'a pas encore** `startOfDayMartinique`. **Tout est tranché** (section MINUTEUR) : il ne reste que **le libellé à valider avec Ken**.
3. **🔧 `fix/seo-og-share` n'existe pas** : les **3 bugs de prod** (`logo.png` mort ×3, dimensions déclarées en dur) **sont toujours en ligne**. C'est **le lot le plus rapide à sortir**, et il ne dépend de rien.

### 2. L'amélioration du frontend — **les bannières des 6 « inclus »** (Ken les fournit)

- **Prévoir l'emplacement maintenant** : un visuel par inclus, **dans l'encadré signature**, avec le libellé de la fiche **rendu en HTML par-dessus** — **jamais de texte dans l'image** (les modèles écrivent mal : « 24FIT PESSORA » sortirait déformé).
- **Le composant doit tenir SANS les images** (dégradé de repli, comme le hero) : elles arriveront une par une, et la page ne doit pas se casser à chaque ajout.
- **Chaque image porte un `alt`** reprenant le libellé de la fiche — accessibilité **et** garde-fou : un libellé ne peut pas dériver de la fiche par la porte des images.
- **Règles verrouillées** (section « Les 6 bannières », plus bas) : aucun logo, aucune interface lisible, aucune promesse de résultat, aucun visage identifiable, **une seule lumière** pour les six.
- 🔴 **ET L'ICÔNE MANQUE DANS LES DEUX ÉTATS — à câbler maintenant** (@vela, vérifié dans le code poussé `4048075`) : `ChallengeProgramCard.tsx` rend aujourd'hui `{item.image ? <img/> : <div style={{background: BANNER_FALLBACK}}/>}` suivi du libellé — **aucune icône**, et la liste `INCLUS` ne porte qu'un `label` et une `image?` : **le lien libellé → icône n'existe pas dans le code**. Conséquence : la porte « 6 icônes dans le DOM » échouerait **avant même la première bannière** (0 au lieu de 6), et la livraison produirait une **grille à deux vitesses** — exactement ce qu'@lyra voulait éviter.
  - **Les 6 pictogrammes sont dessinés et prêts à coller en JSX** : `/opt/data/clients/pessora/page-challenge/icones-inclus-21j.md` (viewBox 24, trait seul, `stroke-width 1.4`, `currentColor`, même grammaire que les icônes du site).
  - **Rendu INCONDITIONNEL** — centré dans l'état de repli, **petit au-dessus du libellé** dans l'état illustré. **Une seule règle de rendu, deux présentations** : c'est ce qui garde les 6 cartes reconnaissables quand 3 auront une photo et 3 non.
  - ⚠️ **Taille : viser ~20 px, pas 15.** Mesuré aux tailles réelles, **deux pictogrammes lâchent à 15 px** — « communauté 24FIT PESSORA » (les deux personnes fusionnent en une tache) et « séances de sport » (l'haltère devient un tiret à deux points) ; les quatre autres sont nets ✅. **Décision @lyra : 20 px, on ne redessine rien** — une seule règle vaut pour les six.
  - 🔴 **ET LA TAILLE SE FIXE EN PX — jamais en `em`, `%` ou dérivée de la largeur de la carte** (@lyra). Sinon l'icône rétrécit avec les cartes étroites et **repasse sous 15 px à 390 px** : le défaut reviendrait **précisément chez le visiteur mobile**, et il serait **invisible en test desktop**. Valeurs : **20 px** au-dessus du libellé quand la bannière est là, **48-56 px** centrée sur le dégradé sinon.
  - 🔴 **ET LA COULEUR DU TRAIT — l'icône est TOUJOURS sur fond sombre** (@vela, mesuré ; c'est le piège qui les rendrait invisibles). L'état sans image, c'est **le dégradé du hero** (oklch 15 % → 7 %) et l'état illustré, c'est **une photo avec un voile sombre** — **donc jamais `sapin`** (`#1E3529`) :
    - `sapin` sur le dégradé de repli = **1,24 → 1,45:1** → **invisible**, pas discret (seuil graphique : **3:1**) ;
    - trait **clair** (ivoire/écru, `#F7F4ED`) sur le même fond = **14,85:1** ✅.
    - ⚠️ **La ligne `stroke: var(--color-sapin)` du fichier `icones-inclus-21j.md` est à corriger** : elle partait du principe que « les mêmes fichiers serviront en clair **et** en sombre », or **ils ne sont jamais sur fond clair**. **@lyra** le corrige dans son fichier ; ici la règle fait foi.
    - **Porte** : contraste du trait sur le fond **réel** ≥ **3:1**, dans les **deux** états.
  - ✅ **Et ce qui est déjà juste, à ne PAS casser en corrigeant** : le repli est **le dégradé du hero** (donc « une seule lumière » ✅) · le conteneur est en `aspect-[4/3]` **dans les deux états** (la hauteur ne bouge pas → **CLS = 0 par construction** ✅) · **aucun pointillé** ✅ · l'`alt` reprend **le libellé de la fiche** ✅ · `loading="lazy"` ✅.

### 3. Les 3 corrections SEO/OG — **préexistantes, à faire dans la même passe**, ⚠️ **mais sur une BRANCHE SÉPARÉE** (`fix/seo-og-share`)

`index.html` : **trois** références mortes à `logo.png` (qui n'existe pas) dont **le JSON-LD** · `src/components/common/PageSEO.tsx:71-72` déclare **1200×630 en dur** alors que l'image servie est un **carré 1024×1024** → letterbox sur tout lien partagé, **déjà en prod** · `seoConfig.ts` est **par page** → l'OG du challenge est une **entrée propre**, pas un remplacement du défaut. Détail en section « PAGE CHALLENGE ».

> **Pourquoi une branche séparée (et pas « dans la même passe » sur la branche du challenge)** : ce sont des **bugs de PROD préexistants** qui touchent **tout le site** — leur recette est **courte et indépendante** (l'image réellement servie + les balises), donc ils **peuvent partir tout de suite**, sans attendre les 8 portes. Embarqués dans `feat/challenge-21j-landing` (17 commits), ils **conditionneraient un correctif de prod à une recette de landing** et **gonfleraient un merge** dont on ne saurait plus dire ce qu'il valide. **Même passe, branches séparées.** *(Les bannières, elles, n'ont pas ce problème : **le composant** — l'emplacement qui tient **sans** les images — va bien sur la branche du challenge ; **les images** se posent après, hors branche, sans retoucher la page.)*
>
> ⚠️ **Il y a un QUATRIÈME point OG, et il n'est PAS une réparation** (@alcyone) : le **câblage de l'OG du challenge** — `og-challenge-1200x630.png` posé comme `og:image` de la route challenge via une **entrée dédiée dans `seoConfig.ts`** (jamais à la place du défaut, `seoConfig` est **par page**), **dimensions déclarées = dimensions du fichier**. C'est un **actif du challenge** → il vit sur la **branche challenge**, pas sur `fix/`. Sans cette ligne, l'image de @user reste **un fichier sur le disque que personne ne sert**. À vérifier dans la spec de la landing. *(Bilan : **trois** réparations de prod sur `fix/seo-og-share`, **une** entrée neuve sur la landing.)*

> 🆕 **Deux ajouts trouvés en vérifiant la config (@nova, 12/09) — même famille, même branche `fix/seo-og-share`, 2 lignes :**
> 1. **`public/robots.txt` est incomplet par rapport au `vercel.json`.** Il `Disallow` : `/admin` · `/mon-espace` · `/demo-espace` · `/mockup-luxe` · `/mockup-croquis-gerant` — mais **pas** `/connexion`, `/inscription`, `/reinitialisation-mot-de-passe`, `/suivi-commande`, qui sont pourtant protégés par `X-Robots-Tag` ✅. **Ce n'est pas une fuite** (l'en-tête couvre ces chemins), c'est **deux listes qui divergeront** : le prochain qui en touche une oubliera l'autre. → aligner les listes, ou écrire dans le fichier que **le `vercel.json` fait autorité**.
> 2. **Son `Sitemap:` pointe sur l'apex** (`https://pessora.fr/sitemap.xml`) alors que le canonique est **`www`** — même défaut que l'`og:url` corrigé ailleurs. → `https://www.pessora.fr/sitemap.xml`.
>
> ℹ️ **Et une différence de sémantique qui explique pourquoi le point « `/admin` nu » ne valait que pour Vercel** : en `robots.txt`, `Disallow: /admin` **couvre déjà la racine et ses sous-chemins** ✅ ; dans `vercel.json`, `source: "/admin/(.*)"` **ne matche pas `/admin`** seul ✅. Deux syntaxes, deux comportements — à ne pas transposer de l'une à l'autre.
>
> ✅ **Bonne nouvelle pour le go-live** : `robots.txt` dit bien **`Allow: /`** — **il ne reste donc qu'un seul verrou** à lever au lancement (`index.html:17`), et le contrôle de l'étape (2)/(3) se fait sur **trois assertions** : `x-robots-tag` **absent** sur `/` et `/menu` en prod · **présent** sur `admin.pessora.fr` · et `robots.txt` toujours en `Allow: /`.

> 🔴 **ET UN SEPTIÈME POINT — ce n'est pas du SEO, c'est une adresse morte (@nova, mesuré le 12/09).** **`pessora.mq` n'existe pas en DNS** (requête DoH → **NXDOMAIN**), alors que **`pessora.fr` a bien des MX** (`mx1/2/3.mail.ovh.net` ✅ : elle **reçoit**). Or le **prompt du PessoBot** donne aux clients **`contact@pessora.mq`** (`docs/PESSOBOT_N8N_SCRIPT_IMPROVED.js:56` et `:127`, `PESSOBOT_PROMPT.md:122/192`, plus README et guides) → **un client qui demande le contact au bot reçoit une adresse qui rebondit**, sans la moindre erreur nulle part. *(Le JSON-LD du site déclare, lui, `contact@pessora.fr` ✅ — donc **deux adresses de contact circulent, dont une morte**.)*
> → **Une seule adresse fait autorité**, partout (site, bot, guides, JSON-LD) ; les `.mq` des docs sont **à purger**. **Question pour @user : laquelle Catherine lit-elle réellement ?** On ne peut pas la deviner. Et c'est la troisième de la même famille : **`logo.png`** (fichier mort), **`jorisliny.com`** (DNS), **`pessora.mq`** (NXDOMAIN) — **une référence déclarée n'est pas une référence qui existe.**

### 4. Les contrastes admin / espace membre — **dette mesurée, à cadrer avec Ken**

**498 usages** de gris sous 60 % (**échec AA**) dans `src/pages/admin` + `src/components/admin` + `src/pages/member` + `src/components/member`. Le pire motif : `labelBase` = **9 px à 45 %** (3,15:1), et il ne vit que dans **3 fichiers** — donc **la correction n'est pas un token** : c'est un chantier **par écran**, avec un compteur avant/après. Règle : **aucun texte sous 60 % de noir, aucune action sous 10 px**. ⚠️ **Lot à part entière — ne pas le glisser dans la page challenge.**

### 5. Puis, dans l'ordre déjà écrit : `X-Robots-Tag` par chemin → lot `profils` → passe conformité → **l'edge function de notification** (la prochaine tâche technique, spec complète en section « PROCHAIN LOT »)

**Et ce qui ne dépend PAS de nous** : tout ce qui est chez Catherine (sa carte, le médiateur, le lien Easy Ta Vie, l'accord footer) + le go-live qui en découle. **On ferme tout ce qui est chez nous.**

---

## 🔄 REVIREMENT DU 12/09 — « COMPLÉMENT DE REVENUS » : de HORS SITE à **sur le site, en choix simple**

**Décision de Ken (12/09), après retour de Catherine : elle VEUT cette partie sur le site.** Cadrée en trois mots qui tiennent tout : **« sans plus »** · **« pas de fonctionnalité code trop complexe »** · **« ils vont gérer avec le bilan »** — plus **« quand même un choix possible »**.

### Ce que ça change
- ❌ **PÉRIMÉ** : la règle « COMPLÉMENT DE REVENUS = EXCLU du site et de tout formulaire », écrite plus bas dans ce doc **et** dans `docs/fiche-papier-challenge-21j.md`. **Elle n'est plus la règle.**
- ✅ **NOUVELLE RÈGLE** : **une section visible**, avec **un choix possible** — et **la gestion se fait au bilan**, en présentiel, avec Catherine. **On n'automatise rien.**

### Techniquement — c'est là que « pas complexe » se gagne
**Aucune table, aucune migration, aucun formulaire dédié.** Le questionnaire post-inscription stocke déjà ses réponses dans `event_registrations.post_registration_details` — un **`jsonb`** (vérifié le 12/09 : `objectif_principal` y est **une clé**, pas une colonne) — et ses options vivent dans `src/data/postRegistrationSurvey.ts`, à côté de `OBJECTIF_OPTIONS`, `BILAN_OFFERT_OPTIONS`, `PRECOMMANDE_OPTIONS`.

Donc **le « choix » = une constante d'options + un champ dans le questionnaire existant**, exactement comme les autres :
```ts
export const OPPORTUNITE_OPTIONS = [
  { value: 'Oui', label: 'Oui, j’aimerais en savoir plus' },
  { value: 'Non', label: 'Pas pour le moment' },
];
```
→ **le `jsonb` prend la clé sans migration** ✅ · **rien à créer en base** ✅ · **le parcours reste le parcours** ✅.

### 🔴 Les garde-fous qui RESTENT (ils ne tombaient pas avec l'exclusion)
1. **AUCUNE promesse de revenus.** Aucun montant, aucun « gagnez X €/mois », aucun « revenus complémentaires jusqu'à… », aucun témoignage de gains. **C'est la règle n°1** — et le risque n°1 : c'est ce qui fait basculer un site commercial dans la promesse de gains.
2. **Le cadre dit ce que c'est** : une **activité de distribution indépendante** — **ni un emploi, ni un salaire**. On ne vend **pas** un revenu, on propose **d'en parler**.
3. **C'est un CHOIX, pas une relance.** Deux options dont « pas pour le moment », et **on n'y revient pas** : pas de séquence d'e-mails, pas de relance automatique.
4. **On ne collecte rien de neuf** : la réponse vit dans le questionnaire existant ✅ — mais ⚠️ **@vela doit vérifier la cohérence du consentement** : le texte doit couvrir **ce qui est réellement proposé** — ni plus (pas de finalité qu'on ne publiait pas), ni moins (l'option existe maintenant).
5. **Aucun visuel, aucun chiffre, aucun logo de l'opportunité** — même famille que les bannières : **pas de preuve inventée**.

**@vela — c'est ta passe** : la phrase de consentement, le libellé exact des deux options, l'absence de toute promesse de revenus. **@lyra** — la section reste **sobre** : elle partage la page avec **l'encadré signature**, ce n'est **pas** un deuxième dispositif.

### 🔴 CE QUE LA SECTION EXIGE EN PLUS — « visible » ≠ « stocké »

**Le `jsonb` `post_registration_details` n'est lu par AUCUN composant** (@alcyone, élargi et revérifié par @elise) : il n'apparaît que dans `src/types/database.ts`, le type généré. Conséquence — **et elle ne date pas du revirement** :

- **`EventRegistrationsList.tsx`**, le seul écran qui liste les inscrits, affiche **Prénom · Nom · Téléphone · Groupe · Date** — **aucune réponse du questionnaire** : ni `objectif_principal`, ni `bilan_offert`, ni le futur `complement_revenus`. ⚠️ **`souhait_info` lui-même n'est pas dans le tableau** (il n'existe que dans l'export CSV).
- **La file de bilan ne les porte pas non plus** : `fn_create_bilan_booking_from_registration` copie `nom · prénom · téléphone` mais **jamais `objectif_*`** — vérifié dans `prosrc` : **0 occurrence**.

**Donc : le « zéro code complexe » est vrai pour le STOCKAGE, faux pour la VISIBILITÉ.** Ajouter le champ sans vue, c'est écrire un choix que **Catherine ne verra jamais**.

**Le correctif** — petit mais réel : un bloc dans la **fiche d'inscription de l'admin** qui affiche les réponses du questionnaire (le `jsonb`, ou les clés nommées). ⚠️ **Et il rend service pour TOUT le questionnaire, pas seulement pour le nouveau champ** : les objectifs sont collectés **pour rien** aujourd'hui, et c'est la donnée la plus sensible du site.

### Les règles de la section (à coder tel quel)
- **Le champ est `z.string().optional()` — JAMAIS `min(1)`** (@vela). Une case qu'on **doit** cocher pour s'inscrire n'est pas un consentement **libre**, et elle contaminerait les autres consentements du même formulaire. **Aucune option pré-cochée** (un « Oui » par défaut, c'est le même problème déguisé). Le « non » est un **choix qui valide**, pas un bouton pâle à côté.
- **Le libellé** : la fiche dit « une **opportunité financière** » — **c'est la seule phrase du bloc qui suggère un gain**, donc la seule qui ne se rattrape pas. Version retenue : *« **Envie d'en savoir plus ?** ☐ Oui, je souhaite en savoir plus sur l'**activité de distribution indépendante**. ☐ Pas pour le moment. »* — les **deux cases au même poids visuel** (@lyra : jamais un « oui » en bouton sombre face à un « non » pâle, sinon le consentement n'est plus libre).
- **La mention qui qualifie est DANS le bloc de l'option** : « **activité de distribution indépendante — ni un emploi, ni un salaire** ». Une mise en garde à trois écrans de la case **ne qualifie pas** ce qu'on accepte.
- **Stocker la CLÉ du libellé, pas `'Oui'`** (@vela) : le libellé **change** (on est en train de le changer) → `'Oui'` ne dira plus quoi dans six mois. Ex. `complement_revenus: 'savoir_plus_activite_independante'`. **La valeur stockée doit dire ce qu'elle veut dire.**
- **À l'écran, la pastille porte LE MÊME MOT que la valeur stockée** — sinon l'écran et la base finissent par dire deux choses différentes, et c'est **l'écran** que Catherine lira.
- **Lisibilité (@lyra, croise l'audit d'hier)** : corps **≥ 11 px** et noir **≥ 60 %** (5,25:1) pour les réponses du questionnaire — cet écran porte aujourd'hui ses libellés en **9 px à 45 %** (**3,15:1, échec AA**). Sinon on **déplace** le problème de la base vers l'écran.
- **Une pastille « à recontacter »** sur la ligne de l'inscrit quand la réponse est « Oui » : sans elle, Catherine doit **relire chaque ligne** pour trouver les oui — et dans trois semaines, elle ne les cherchera plus.
- ✅ **Accès vérifié par @vela** : `event_registrations` rend **0 ligne à l'anon** et **0 ligne à un membre** — les lignes vont **uniquement à l'admin**. Le bloc qui affichera les réponses **ne desserre pas** qui peut les lire (vérifié **avant** de mettre à l'écran des objectifs de poids et un intérêt commercial, pas après).

### Porte de recette @vela (4 comptages, sur la preview)
① **aucun montant** / « €/mois » / « gagnez » / **témoignage de revenus** dans la section ✅ · ② le formulaire **valide** avec « Pas pour le moment » **et** avec **rien de coché** ✅ · ③ **aucune case pré-cochée** ✅ · ④ **mention de qualification présente dans le bloc de l'option** ✅.

---

## ✅ `feat/x-robots-tag` — le lot est CORRECT · **fausse alerte du 12/09 corrigée ici**

⚠️ **Correction d'une alerte erronée, écrite dans ce doc le 12/09 par @elise et @vela, et levée par @alcyone. NE RIEN SUPPRIMER.**

**Ce que nous avions lu** : `source: /(.*)` + `X-Robots-Tag: noindex, nofollow` → « tout le site est noindex, l'étape (3) du go-live est morte ». **C'était FAUX : nous avions lu `source` et `headers` sans lire la clause `has`.**

**Ce que dit réellement la config** :
```json
{"source": "/(.*)",
 "has": [{"type":"header","key":"host","value":"admin.pessora.fr"}],
 "headers": [{"key":"X-Robots-Tag","value":"noindex, nofollow"}]}
```
→ cette règle noindexe **le sous-domaine `admin.pessora.fr` uniquement** — ce qui est **exactement voulu** : l'admin porte des **données client**, il ne doit **jamais** être indexé. Les autres règles (`/connexion`, `/inscription`, `/mon-espace`, `/demo-espace`, `/suivi-commande`, `/mockup-luxe`, `/mockup-croquis-gerant`, `/reinitialisation-mot-de-passe`, `/admin/(.*)`) sont **sans condition** et couvrent bien les chemins techniques **du domaine `www`** ✅.

**Ce qu'on aurait cassé en « corrigeant »** : supprimer ce `/(.*)` retirait la protection noindex **de l'admin**, pas du site public — le site serait resté verrouillé par le `<meta>` d'`index.html`, et **l'admin serait devenu indexable**. Le pire des cas, en miroir.

**Donc : le lot est BON tel que poussé.** Il reste **le check en prod après merge**, **path par path sur `www`** — en sachant que le `<meta>` d'`index.html` masquera encore tout **jusqu'à l'étape (3)**.

**Et le point « `/admin` nu non couvert » est sans objet** : `/admin` nu sur `www` redirige déjà vers le sous-domaine, qui est noindexé par le `has`.

### 🔒 Le verrou SEO est VOLONTAIRE (décision de Ken) — ne pas le lever par erreur
`index.html:17` porte `<meta name="robots" content="noindex, nofollow">` **exprès** : le SEO ne doit **pas** démarrer avant le go-live. **C'est cette balise qui verrouille le site**, et c'est **elle seule** que l'étape (3) lèvera — **au moment du lancement, pas avant**. Tant qu'elle est là, le site n'est pas indexé, **même si tout le reste est propre**.

⚠️ **La leçon, à ranger avec les autres** : **une condition (`has` / `missing`) fait partie de la règle.** Lire `source` + `headers` en sautant `has`, c'est lire une sonde **sans son filtre** — exactement ce qu'on s'interdit sur la base. Ici c'est arrivé **sur la config**, et ça a produit une instruction qui aurait **dégradé la sécurité de l'admin**.

---

## RÈGLES GÉNÉRALES (permanentes)

- **Une branche par lot** · jamais de push direct sur `main` · **aucun merge sans recette verte de @vela**.
- **Gate** : `npx tsc --noEmit` + build Vercel. (Le build local est impossible : `@heroui-pro/react` postinstall.) Les 10 échecs `cartStore.test.ts` sont **pré-existants**.
- **Une seule personne dans le repo à la fois.**
- **Une migration appliquée = le fichier mergé.** Si la base change après coup, on ajoute une **migration de suivi datée** — on ne modifie **jamais** un fichier déjà appliqué (le blob appliqué doit rester celui qui a été relu).
- 🔐 **Depuis le 11/09 — l'écriture en base s'ANNONCE, et se VÉRIFIE.** Plusieurs personnes ont le PAT (c'est normal) : l'obligation n'est pas de demander la permission, c'est de **dire qu'on a écrit** (quoi, en une transaction). Protocole, à chaque application :
  `python3 /opt/data/cache/base_fingerprint.py --snapshot avant-application` → **application en une transaction** → `--snapshot apres-application` → `--diff`. Le diff dit **où ET quoi** (les corps `prosrc` sont stockés) ; aucune écriture non annoncée ne peut plus passer inaperçue. C'est le `git status` de la base — et il est **muet quand rien n'a bougé** (vérifié).
  ⚠️ **`supabase_migrations.schema_migrations` ne dit PAS l'état de la base** : elle ignore nos applications (API Management) et enregistre celles du MCP Supabase. Un écart entre cette table et le repo est **normal** — la vérification se fait **par objet** (`prosrc`, `pg_trigger`, `pg_policies`, `pg_indexes`), jamais par cette table.
- 🔒 **Une seule personne écrit en base à la fois — et elle l'ANNONCE.** Plusieurs personnes ont le PAT (c'est normal, @elise et @alcyone l'ont aussi) : ce qui rend l'écriture sûre, ce n'est pas le privilège, c'est **l'annonce + la relecture par un autre**. Celui qui applique **dit ce qu'il applique** (quoi, en une transaction, sur quel objet), applique **en une transaction**, et **quelqu'un d'autre vérifie par objet** (`prosrc`, `pg_trigger`, `pg_policies`). Sur Pessora, **l'écrivain de référence est @alcyone** ; **Claude écrit le code** et, s'il applique quelque chose en base, **il le dit** — jamais en silence. C'est « une seule personne dans le repo à la fois », appliqué à la base.
  - *Motif (11/09)* : une migration **`20260911125459`** — absente de **tout** fichier du repo — est apparue en base **sans avoir été annoncée** (version à mi-lot du travail en cours ; base intacte par chance). Le problème n'est **pas** l'accès : c'est **l'écriture non annoncée**, qu'on ne peut ni dater, ni relire, ni contrôler.
  - **L'obligation, c'est l'ANNONCE** (arbitrage Ken, 11/09) : « tant que le travail est fait ». On ne se demande pas la permission d'écrire — on **dit qu'on l'a fait**, et quelqu'un relit. La relecture est un **filet de sécurité**, jamais un droit de veto : personne n'attend un « go » pour appliquer une migration déjà relue. Ce qui est interdit, c'est **l'écriture silencieuse**.
  - Conséquence de méthode : après chaque application, **vérifier qu'aucune migration inconnue n'est apparue** dans la table de suivi — et garder en tête que **`supabase_migrations.schema_migrations` ne dit pas l'état de la base** (elle **ignore** nos applications par API Management et **enregistre** les autres : fausse dans les deux sens).
- **Les migrations ne sont PAS la source de vérité de la base.** Trois cas ce soir : `bilan_bookings_insert_public`, `bilan_slots_select_public`, `profiles_insert_own` existent en base et dans **aucune** migration. Tout audit RLS se fait **en live** (`pg_policies`, `information_schema`), jamais en relisant les fichiers.
- **RLS dit oui ≠ privilège dit oui.** Les deux sont nécessaires. Une policy correcte avec un `GRANT` manquant = fonctionnalité cassée (le bouton DELETE de l'admin, ce soir). On le prouve en **faisant l'action pour de vrai avec le bon rôle**.
- **Une garde dont l'entrée vient de l'appelant n'est pas une garde.** Toute règle validée côté client doit exister côté serveur.
- **Jamais de faux succès** : une écriture ne vaut que si l'on sait qu'elle a touché une ligne (et sur un `INSERT`, un `RETURNING` exige une policy SELECT — attention aux chemins invités).
- **Devis :** rien de tout ça ne touche le périmètre vendu.

---

## 🧪 À FAIRE MAINTENANT — test end-to-end (Playwright, sous les yeux de Ken)

**Scénario complet, prêt à dérouler : `docs/test-e2e-challenge-2026-09-11.md`.**

Il couvre : créer un challenge (`TEST-KEN-`) depuis l'admin → créer 2 créneaux → le parcours public complet (inscription → étape bilan → réservation → demande dans la file de Catherine) → l'annulation (ligne **et** créneau) → le test de l'e-mail du balayage → **et le nettoyage obligatoire** (`TEST-%` = 0, retour au baseline).

**Points non négociables de ce test** : tout est préfixé `TEST-KEN-` · on teste **en production** · les identifiants admin se lisent **à l'exécution** depuis le fichier de secrets (jamais dans le code, jamais dans un chat) · **aucun e-mail ne doit partir chez la cliente** (vérifier `ADMIN_EMAIL` = `ken972@yopmail.com` **avant**) · et le nettoyage + l'empreinte de sortie font partie du test.

⚠️ **L'étape 6 (e-mail du balayage) nécessite le lot ② codé** — le reste est testable **tout de suite**.

---

## ÉTAT AU 10/09/2026 (nuit) — clôture de journée

- **`origin/main` = `c4325d6`** · **production déployée** (Vercel READY).
- **Les 3 migrations du Challenge/Bilan sont en base ET dans `main`** → **aucune migration appliquée hors du repo** (le motif corrigé toute la journée). Ne pas modifier les fichiers déjà appliqués : tout correctif passe par une **migration de suivi datée**.
- **Branches mergées ce soir** : `chore/gitignore-env`, `feat/bloc-partenariat-page-contact`, `feat/tests-paiement-stripe`, `fix/google-full-name` (fonction et trigger **déjà en base** → merger a **aligné** repo↔base ; personne ne l'applique).
- ⚠️ **`feat/tests-paiement-stripe` ne contient AUCUN test** — une seule doc de 47 lignes. **Ne jamais dire « les tests Stripe sont faits »** : un nom de branche n'est pas une preuve.
- ⚠️ **`feat/bloc-partenariat-page-contact` est un ajout hors brief** (demande de Ken) : à déclarer comme tel, ce n'est pas un point du CR de Catherine. Vérifié en live après merge : `/contact` sert le CTA, le lien mène à `/contact-partenariat`, 0 erreur console.
- **Prochaine étape** : la **RPC questionnaire** (lot 1 ci-dessous), puis l'edge function, puis `X-Robots-Tag`, le lot `profils`, la conformité.

---

## 2026-09-10 (soir) — LOT A : Challenge / Bilan — ✅ MERGÉ

**État : le merge du lot A est `047c294`** (17 fichiers, +1029/−12) — vérifié comme **déploiement de production servi** (Vercel, ref `main`, état READY). Les deux migrations sont en base. *(`origin/main` a avancé depuis — c'est normal, ce SHA est la trace du lot A, pas la tête de branche.)*

Contenu : garanties serveur (fenêtre J-14→J, anti double-réservation, dédup hors-date, téléphone normalisé, `origine`), widget de réservation, catégories d'erreur partagées, validation téléphone 9 chiffres, accroches Challenge.

**Réserve écrite, à ne pas oublier :** le critère **⑨** (`origine = 'questionnaire'`) **n'est PAS validé** — aucun appelant n'existe tant que la RPC n'est pas écrite. Il se recettera **avec** elle.

**À attendre, ce n'est pas un bug :** le widget ne se monte que sur un événement `type = 'challenge'` (`EvenementDetail.tsx:364`). Comme **aucun challenge n'existe en base**, **aucune page ne l'affiche aujourd'hui** — un visiteur ne voit rien de nouveau (vérifié en live : `/evenements` et `/evenements/runclub` rendent sans erreur console). Dès que Catherine crée son challenge, la page affichera **ses** créneaux — et **0** tant qu'aucun créneau ne lui est rattaché : les 7 créneaux historiques sont **orphelins** (sans `challenge_event_id`), donc invisibles par construction.

**Fichiers d'historique (ne pas modifier) :** `20260911100000_lot_a_challenge_bilan_server_guards.sql` (blob `709359a9…`, appliqué) + `20260911120000_grant_delete_bilan_bookings.sql` (`d777652`, correctif daté).

---

## ✅ 2026-09-10 (nuit) — RÉSOLU : rattachement créneau → challenge (mergé `c4325d6`)

**État : mergé et déployé (Vercel READY).** La 3ᵉ migration `20260911130000_attach_slot_to_challenge.sql` est **en base et dans `main`** — le dépôt et la base sont au même niveau, **aucune migration appliquée hors du repo**.

Trigger `trg_bilan_slot_attach_challenge` + fonction `fn_bilan_slot_attach_challenge` (`SECURITY DEFINER`, `search_path=public`). **Recette serveur : 7/7 verts** — rattachement automatique (insert identique à celui de l'admin), déterminisme prouvé dans **les deux ordres de création**, recalcul sur changement de date, retour à `NULL` hors fenêtre, non-régression (une réservation ne touche pas le lien), visibilité en anon, base rendue intacte (7 créneaux / 0 booking / 1 événement).

⚠️ **Seul reste, purement visuel :** le libellé de l'admin. `slotChallengeLabel` rend `→ titre` **dès qu'un lien existe**, sans tester `active` ni la fenêtre → un créneau rattaché à un challenge **désactivé** ou **hors fenêtre** s'affiche comme normal alors qu'il est invisible côté public. Le cas **orphelin** est bien traité (message ambre). À corriger au prochain passage front : distinguer « **pas encore ouvert (J-14 → J)** » et « **challenge désactivé** » — les données (`active`, `date`) sont déjà dans le composant.

---

## 🔴 2026-09-10 (après merge) — HISTORIQUE : le constat qui a produit le correctif ci-dessus

**Constat vérifié dans le code de `main` (pas une hypothèse) :**

- `AdminBilans.tsx:190-199` — `createSlotAtSelected()` insère `{ date, heure, disponible: true }` : **jamais `challenge_event_id`**. Aucun écran, aucune fonction ne renseigne cette colonne (elle n'apparaît que dans `BilanBookingWidget.tsx:78` en **lecture**, et dans `types/database.ts`).
- `BilanBookingWidget.tsx:76-78` — le widget lit `.eq('challenge_event_id', challengeEventId)`.
- Conséquence : **tout créneau créé depuis son admin est orphelin** → `fn_bilan_slot_bookable()` = `false` → **invisible et non réservable**. Créer un challenge puis des créneaux **ne suffit pas** : la page affichera **0 créneau**, même avec des créneaux `disponible = true`.

**Régression induite par la v5 sur un flux existant** : avant la migration, la policy `bilan_slots_select_public (USING true)` rendait le créneau visible ; depuis, il ne l'est plus tant qu'il n'est pas rattaché. Le geste « ajouter un créneau » dans son admin est donc **sans effet visible** aujourd'hui — il faut le dire, sinon c'est un « ça ne marche pas » devant la cliente.

**Correctif retenu (doctrine : la règle vit côté serveur, l'UI affiche)** — **trigger `BEFORE INSERT OR UPDATE`** sur `bilan_slots` (⚠️ **aucun trigger n'existe aujourd'hui sur cette table** : c'est une page blanche, et il n'y a **aucun backfill** à prévoir — les 7 créneaux historiques restent orphelins, ce qui est correct puisqu'ils sont passés).

1. **Rattachement** : si `challenge_event_id IS NULL`, rattacher au challenge `active` dont la fenêtre couvre la date (`events.date - 14 <= NEW.date <= events.date`, `type = 'challenge'`) ; **départage déterministe obligatoire** s'il y en a plusieurs : **le challenge dont la date est la plus proche au-dessus de celle du créneau** (`ORDER BY e.date ASC LIMIT 1`) — sinon le résultat dépend du plan d'exécution. Si aucun ne correspond → laisser `NULL` (orphelin assumé).
2. **Recalcul** : recalculer aussi quand `NEW.date IS DISTINCT FROM OLD.date` (déplacer un créneau hors fenêtre laisserait sinon un lien **périmé mais d'apparence correcte** → invisible et **indiagnosticable à l'écran**). **Ne jamais écraser un lien posé explicitement** par l'admin.
3. **État lisible dans l'admin (exigence cliente)** : un créneau orphelin **ne doit pas disparaître en silence**. L'admin doit dire **pourquoi** — « ce créneau ne s'affichera pas : sa date est hors de la fenêtre du challenge ». Même logique que la colonne `origine` dans l'onglet « Demandes ».
4. Un sélecteur « challenge concerné » dans l'admin reste souhaitable **plus tard** (lisibilité), mais ne doit **jamais** être la seule garantie.

**Critères de recette (à jouer tels quels)** : ① créer un challenge dans l'admin → **ajouter un créneau depuis l'admin** → rattaché, **visible et réservable** sur la page du challenge, **sans aucun SQL** · ② créneau hors de toute fenêtre → reste orphelin **et l'admin dit pourquoi** · ③ **chevauchement de deux challenges, créés dans les deux ordres** (20/09 puis 05/10, et l'inverse) → **le même créneau tombe sur le même challenge** dans les deux cas (déterminisme prouvé, pas seulement écrit) · ④ déplacer la date d'un créneau existant → le lien se **recalcule**. Aujourd'hui : ❌ sur les quatre.

**Lien avec la migration v5** : ce n'est **pas** un oubli du lot A côté client — c'est un lien manquant entre deux lots (la colonne est arrivée avec la v5, l'écran de saisie des créneaux est antérieur et n'a pas suivi). À traiter comme un correctif **avant** la démo du Challenge.

---

**ÉTAT DE LA BASE (11/09, après application — référence pour toute recette)**
`bilan_slots` = **7** (7 orphelins, inchangé) · `bilan_bookings` = **0** · `events` = **1** (`0 challenge`) · `event_registrations` = **8** (dont **7 `TEST*` héritées** → purge go-live) · `rate_limits` = **19 entrées** (compteurs 24 h, dont **12 issues de nos recettes** → **à ajouter à l'inventaire de purge**).
➡️ **Une empreinte d'objets est prise à chaque application** : `python3 /opt/data/cache/base_fingerprint.py --snapshot` avant / après, puis `--diff`. Une écriture non annoncée apparaît alors dans un diff, datée.
➡️ **Fixtures du test E2E** : préfixe **`TEST-KEN-`**, purgées derrière — scénario complet dans **`docs/test-e2e-challenge-2026-09-11.md`**.

---

## ✅ PORTE FRANCHIE — `feat/route-mes-bilans-membre` **mergée** (`7e4fcf0`)

Recette @vela **verte sur `a6cc9c7`** (critère 6 bout en bout : ligne `annule` **et** créneau rouvert ; capture d'échec tirée par `route.abort()`, **zéro écriture en base**), verrou code @nova vert, verdict visuel @lyra vert (« l'écran ne ment plus »). **Tout est dans `main`** :

- `.select('id')` + contrôle de ligne → **message affiché DANS la carte du RDV** (13 px, `text-red-600`, **pleine largeur en mobile**), contact du site (`pessora.mq@gmail.com`) au lieu d'Instagram, la phrase **« rien n'a été annulé »**, et **`setCancelError(null)` au succès** ;
- le bouton **« Annuler »** passe en **12 px / rouge plein** — il était en **10 px à 70 % d'opacité**, donc plus petit et plus pâle que le message d'erreur qu'on venait d'agrandir ;
- le récap est corrigé (`feat/rpc-questionnaire-bilan` **est** mergée) et la ligne fausse du chef de branche est partie avec.

⚠️ **Deux points restent ouverts, hors de cette porte :** **(a)** @lyra a relevé que **« ÓRA+ » est toujours dans la navigation de l'espace membre** (sidebar + barre mobile) → **passe Óra+** ; **(b)** les **7 créneaux legacy** de `bilan_slots` (avril/mai, passés, 0 réservation) s'affichent **en tête de l'onglet Créneaux** de Catherine — **suppression décidée et datée à la purge**, sur go de Ken.

*Ce qui suit est conservé comme **trace** de ce qui a été corrigé — les quatre points sont désormais dans `main`.*

### 1. Ce qui bloquait — **corrigé**

**Ce qui est bon** ✅ : la route **`/mon-espace/bilans`** — ⚠️ **et non** `/membre/bilans`, qui rend un **404** (vérifié en preview par @vela le 11/09 ; l'URL fausse venait de la revue d'@nova, recopiée telle quelle dans ce doc : **on ne recopie pas une revue sans vérifier son chemin**) + l'entrée « Mes bilans » dans la nav de l'espace membre · la suppression du booking client-side bugué (556 → 207 lignes) · le renvoi vers **le widget recetté** pour réserver · le récap du test dans `docs/`.

🔴 **Ce qui bloque** — l'annulation écrit sans rien vérifier (`MesBilans.tsx`, ~l.76) :
```js
await supabase.from('bilan_bookings').update({ statut: 'annule' }).eq('id', cancelTarget);
setBookings(prev => prev.map(b => b.id === cancelTarget ? {...b, statut: 'annule'} : b));
```
**Aucun contrôle d'erreur, aucune vérification de ligne, mise à jour optimiste** → si l'écriture touche **0 ligne** (policy, réseau, mauvaise ligne), l'écran affiche « **Annulé** » alors que **rien n'est annulé**, et le **créneau reste fermé**. C'est le bug `profiles` et le bug « sélection de créneau » recomposés sur la page qu'on vient d'ouvrir.

**Correctif** : `.select('id')` sur l'`update`, et si `data.length === 0` → **message d'erreur à l'écran**, pas de mise à jour optimiste. ⚠️ Ici le `.select()` est **le bon outil** (c'est **sa propre ligne**, le `RETURNING` fonctionne) — contrairement au chemin **invité** du widget, où il casserait tout. Puis le critère 6 : après annulation, relire **la ligne** (`statut = 'annule'`) **et le créneau** (redevenu réservable).

### 2. Le récap du test dit une chose fausse (`docs/recap-test-e2e-challenge-2026-09-11.md`)
Il annonce que **les deux branches ne sont pas mergées** — or **`feat/rpc-questionnaire-bilan` EST mergée** (`main` = `d8ecf00`, et la migration dans `main` **est** le blob appliqué `451d0ee1…`). **Seule `feat/route-mes-bilans-membre` est en attente.** Corriger la ligne.

### 3. Les captures du test n'ont pas été archivées
Le scénario exigeait **5 états × 2 formats** dans un dossier daté en 600. La branche ne porte **que le rapport** — et comme les lignes du test ont été **nettoyées**, ces états **ne se re-tirent plus** sans réécrire en base. Donc : **si tu les as encore, verse-les dans le dossier daté ; sinon on l'écrit tel quel** (la forme a été validée sur la maquette, pas sur les écrans de prod). On ne laisse pas croire que la session a été validée à l'image.

---

## PROCHAIN LOT — dans l'ordre

### 1. RPC questionnaire post-inscription — ✅ **CLOS** (appliqué, recetté, mergé)

**Fait le 11/09** : branche `feat/rpc-questionnaire-bilan` mergée (`d8ecf00`), **blob appliqué = blob mergé** (`451d0ee18b9d766f2df973f665f0cbefec54f117`). **Recette 12/12 verte** : la demande est créée avec `origine = 'questionnaire'`, `challenge_event_id` = l'événement de l'inscription, `user_id` du membre · l'annulation **écrit** et **rouvre le créneau** · le GUC ne fuit pas (12 inserts consécutifs en `visiteur`) · la garde `P0004` tient sur l'INSERT **et** le PATCH (y compris un uuid inexistant).
**Ne pas y retoucher.**

**Spec d'origine (réalisée — conservée comme trace de ce qui a été demandé)**
La réponse « je veux mon bilan » du questionnaire devait créer **une demande dans la file de Catherine** — avant, elle partait dans un JSON que **personne n'affiche**.

- **Une seule file** : la RPC écrit une ligne `bilan_bookings` (`slot_id = NULL`, `statut = 'en_attente'`).
- **Champ `bilan_offert` réactivé** dans `getPostRegistrationSteps` **pour le type `challenge` uniquement** (jamais pour tous les types — c'est l'erreur d'origine). Les options `BILAN_OFFERT_OPTIONS` existent déjà.
- **Elle lit `event_registrations`** pour `nom`, `prenom`, `telephone` (jamais le payload client — ça ferme le forgeage et fiabilise la clé de dédup).
- **`challenge_event_id` = l'événement de l'inscription** (pas la déduction générique : pendant le challenge, aucun challenge passé n'existe).
- ⚠️ **Et conditionné au TYPE de l'événement** (ajout du 11/09, @alcyone) : si l'événement de l'inscription n'est **pas** de type `challenge` → **REFUS**. Raison : la RPC est générique et `bilan_offert` **n'est pas** dans les clés rejetées des autres types (`precommande_offre`, `gaufre_salee`, `gaufre_salee_autre` seulement) → une inscription `event` ou `run_club` peut envoyer cette clé, et on créerait une demande de bilan **rattachée à un événement qui n'est pas un challenge**, ce que le brief interdit (l.27). **Pas de repli sur `fn_deduce_hors_date_challenge()`** sur ce chemin : cette déduction sert au chemin **public hors-date**, qui n'a **pas** d'inscription à rattacher.
  - **Contrôle associé** : après la RPC, **aucune ligne de `bilan_bookings` ne doit pointer vers un `events.type <> 'challenge'`** — à jouer en même temps que la recette ⑨.
- **`user_id = v_reg.user_id`** dans l'`INSERT` (ajout du 11/09, @vela + @alcyone) : sans lui, la ligne **n'appartient à personne** → dans l'espace membre, **l'annulation filtre la ligne** (`auth.uid() = user_id`) → **0 ligne, aucune erreur** : le membre lit « Annulé », la demande reste `en_attente` dans la file de Catherine, **et le créneau n'est pas rouvert** (le trigger `AFTER UPDATE` ne voit rien). Un invité (`user_id` NULL) reste non annulable — c'est cohérent, et ça se recette : **après annulation par un membre, relire la ligne (`statut = 'annule'`) ET le créneau (redevenu réservable)**.
- `date_rdv = today`, `heure_rdv = 00:00`, `notes = 'Demande via questionnaire post-inscription'` (les 5 colonnes `NOT NULL` sont `nom`, `prenom`, `telephone`, `date_rdv`, `heure_rdv`).
- **`origine = 'questionnaire'`** via le GUC de session : `set_config('pessora.bilan_origine', 'questionnaire', **true**)` — le trigger lit `current_setting('pessora.bilan_origine', true)`.
  ⚠️ **Le 3ᵉ argument `true` (`is_local`) n'est pas optionnel** : il limite la valeur à **la transaction**. Avec `false`, le réglage **persiste sur la connexion** — et comme PostgREST **pool** ses connexions, la requête suivante d'un **autre** client serait étiquetée « questionnaire ». Le trigger ne lit `origine` dans **aucune garde** (c'est descriptif) : la fuite serait donc **cosmétique, mais silencieuse** — des demandes mal étiquetées dans la file de Catherine, sans aucune erreur.
- **Critère de recette ⑫ (non-fuite du GUC)** — il ne se lit pas, il se **teste**, et **un seul contrôle ne prouve rien** (la requête suivante peut tomber sur une autre connexion du pool) : appeler la RPC, puis enchaîner **10 inserts REST directs d'affilée** → **les 10** doivent être étiquetés `visiteur` (plus une variante après une pause). Un critère qui ne peut pas échouer n'est pas un critère.
- **Absorber** `23505` (dédup) et `P0001` (rate-limit) avec un message clair — jamais une erreur brute.
- **La RPC est `SECURITY DEFINER`** : elle contourne les policies. Donc **elle pose elle-même** statut/date/origine, et **le chemin questionnaire n'hérite PAS de la règle J+7** (au moment du questionnaire, le challenge est en cours → la garde le refuserait lui-même). À écrire en commentaire, sinon quelqu'un « harmonisera » un jour et cassera le questionnaire.
- 🔴 **TROU VIVANT, PROUVÉ LE 11/09 — pas une dette** : un **visiteur** (REST anon) peut créer une ligne `bilan_bookings` avec `challenge_event_id` = un événement **`type='event'`** → mesuré : **201**, la valeur est **conservée telle quelle**. Mécanisme : le trigger ne **déduit** le challenge que si la valeur est **NULL** (`IF NEW.challenge_event_id IS NULL`) → une valeur **fournie par le client passe**, et le `WITH CHECK` de la policy ne regarde pas le type de l'événement. Conséquence : la règle portée par la **RPC** (`refus si l'événement de l'inscription n'est pas un challenge`) ne ferme **que le chemin questionnaire** — le chemin public reste ouvert, et le CR (« le bilan est toujours rattaché à un challenge ») n'est pas tenu.
- **Garde à poser DANS CE LOT** (même doctrine que le rattachement du créneau) : un trigger **`BEFORE INSERT OR UPDATE OF challenge_event_id`** sur `bilan_bookings` qui **refuse** si `NEW.challenge_event_id IS NOT NULL` et que l'événement n'est **pas `type = 'challenge'`**. **SQLSTATE `P0004`** (`23505`/`P0001`/`P0002`/`P0003` sont déjà pris) pour que la recette le nomme sans ambiguïté.
  - 🔴 **Deux exigences non négociables sur ce trigger** :
    - **`SECURITY DEFINER` + `SET search_path TO 'public'`** (comme le trigger de déduction). Sinon la garde interroge `events` **avec la RLS de l'appelant** : en `anon`, son `EXISTS` ne voit pas l'événement → elle **refuse des inserts parfaitement légitimes**. Une garde qui produit de **faux refus** est plus difficile à diagnostiquer qu'un trou.
    - **Le nom doit trier APRÈS `trg_bilan_booking_before_insert`** → **`trg_bilan_booking_guard_challenge_type`**. PostgreSQL déclenche les `BEFORE` **par ordre alphabétique du nom** : une garde nommée avant s'exécuterait sur `challenge_event_id = NULL` (valeur autorisée), **passerait**, et la déduction poserait ensuite son lien → la garde n'aurait **jamais validé la valeur déduite**. Corollaire honnête : **ce cas ne se mesure pas** (la déduction ne produit que des challenges valides) → la réponse est **le nom**, pas un critère de plus.
  - ⚠️ **DÉCISION (11/09, @nova + @alcyone) : `type` SEUL — PAS `active`.** `active` est un **réglage d'affichage** que Catherine bascule elle-même ; lier une **garantie d'écriture** à un **toggle** reproduirait le scénario du créneau orphelin : le jour où elle désactive un challenge terminé, les questionnaires **en cours** échoueraient **en silence**, chez de vrais clients, sur un formulaire qu'ils croient envoyé. L'invariant du CR est « rattaché à un **challenge** », pas « à un challenge visible ».
  - **La déduction, elle, garde `type='challenge' AND active=true`** : elle choisit un rattachement automatique, donc elle doit viser un challenge **vivant**. Les deux règles sont cohérentes : *déduction = vivant*, *garde = de type challenge*.
  - **Un questionnaire rempli pendant un challenge désactivé doit produire sa demande** — c'est Catherine qui arbitre dans sa file ; refuser perdrait une vraie demande.
  - **La garde tourne pour TOUS les rôles**, y compris `postgres` dans la RPC `SECURITY DEFINER` → après elle, **tout écrivain est validé**, déduction comprise.
  - **Aucun backfill** : `bilan_bookings` est **vide** (compté le 11/09).
- ⚠️ **Rappel structurel** : la clé étrangère ne référence que `events(id)`, **sans contrôle de `type`** — c'est ce qui rend la garde nécessaire, et c'est le même motif « une colonne, un seul écrivain » que le créneau orphelin du lot A.
- **Recette de cette garde** : POST anon avec `challenge_event_id` = un événement **non-challenge** → **refus `P0004`** · avec un challenge → **201** · **PATCH** d'une ligne vers un non-challenge → **`P0004`** (le `UPDATE OF` s'évalue sur la **liste `SET` du statement**, pas sur ce qu'un `BEFORE` réécrit ensuite — **à mesurer, pas à déduire**) · **annulation par un membre → relire la ligne (`statut = 'annule'`) ET le créneau (redevenu réservable)**, jamais le message de l'interface · puis `SELECT count(*) FROM bilan_bookings b JOIN events e ON e.id = b.challenge_event_id WHERE e.type <> 'challenge'` → **0**.
- 🔒 **CRITÈRES DE RECETTE DU LOT (contre-signature @vela — la liste de référence, à jouer telle quelle après application)** :
  1. **anon → `challenge_event_id` = événement `type='event'`** : refus **`P0004`** (aujourd'hui : **201** — c'est le trou prouvé du 11/09) ;
  2. **anon → `challenge_event_id` = challenge valide** : **201** (la garde ne doit pas produire de faux refus — d'où le `SECURITY DEFINER`) ;
  2bis. 🔴 **NON-RÉGRESSION DU CHEMIN NORMAL (le plus important, et le plus facile à casser)** : une réservation **par créneau** (le parcours public habituel, `slot_id` renseigné) doit toujours rendre **201**, et le créneau passer `disponible = false`. ⚠️ La garde ne doit **refuser que** `challenge_event_id IS NOT NULL AND type <> 'challenge'` : elle doit **laisser passer `NULL`** — sinon elle casse la réservation par créneau (dont le lien peut être **NULL** si le créneau est orphelin) et le formulaire public avec. C'est le critère à jouer **avant** les autres : un correctif qui casse le parcours le plus courant est pire que le trou qu'il ferme ;
  3. **`PATCH` d'une ligne vers un non-challenge** → **`P0004`** (comportement `UPDATE OF` **mesuré**, pas supposé) ;
  3bis. **`challenge_event_id` = un uuid qui n'existe pas** → **`P0004`** : le `type` lu vaut alors `NULL`, et `NULL IS DISTINCT FROM 'challenge'` est **vrai** → refus ✅ (un `<> 'challenge'` aurait laissé passer — c'est la différence que la garde doit avoir). À jouer, c'est gratuit et ça prouve que la garde ne se contente pas des événements connus ;

  4. **croisement** `SELECT count(*) FROM bilan_bookings b JOIN events e ON e.id = b.challenge_event_id WHERE e.type <> 'challenge'` → **0** ;
  5. **dédup par téléphone** : 2ᵉ demande, même numéro **dans un autre format** → **`P0002`** ;
  6. **annulation par le membre** → relire **la ligne** (`statut = 'annule'`) **ET le créneau** (redevenu réservable) — pas le message de l'interface ;
  7. **⑫ non-fuite du GUC** : après un appel RPC **réel**, **10 inserts REST consécutifs** tous étiquetés `visiteur` (+ variante après une pause, + variante **après échec/rollback**) ;
  8bis. 🔴 **Conséquence non évidente à vérifier** : l'`INSERT` de la RPC traverse **le même trigger `BEFORE INSERT`** que le parcours public → donc le questionnaire **hérite** de la dédup (`P0002`), du rate-limit (`P0001`) et du contrôle de téléphone (`P0003`). Cas à jouer : **une 2ᵉ demande pour une personne qui a déjà une demande en attente → `P0002`, message propre, jamais une erreur brute** (le front mappe bien `P0001`→`P0004`, vérifié). Un chemin « de confiance » n'est pas un chemin sans garde : c'est le même trigger pour tout le monde.
  8. **⑨** : demande créée via le questionnaire → `origine = 'questionnaire'` **et** `challenge_event_id` = l'événement de l'inscription, visible dans l'onglet « Demandes » ;
  9. **contrôle STRUCTUREL (comportement non mesurable, dépendance vérifiable)** : le **dernier** trigger `BEFORE INSERT` de `bilan_bookings` en ordre alphabétique doit être la garde — `SELECT tgname FROM pg_trigger WHERE tgrelid='public.bilan_bookings'::regclass AND NOT tgisinternal AND (tgtype & 2)=2 AND (tgtype & 4)=4 AND tgenabled <> 'D' ORDER BY tgname;` (⚠️ pas `tgtype = 7` : la garde sera **`INSERT OR UPDATE`**, donc **23** → un filtre exact donnerait un **faux rouge permanent**) ;
  10. **sortie de recette** : retour **au baseline, à l'identique** — **8 inscriptions (dont 7 `TEST*` héritées, celles de la purge go-live) / 7 créneaux / 1 événement (type `event`) / 0 booking**.
      ⚠️ **Deux critères différents, à ne pas confondre** : la **recette** exige le **retour au baseline** (les 7 `TEST*` historiques sont toujours là — les compter comme un échec serait un critère mal calibré, vécu le 11/09) ; c'est la **purge go-live** qui exige **`TEST-%` = 0**.
- **Recette ⑨** : après une demande via questionnaire → `origine = 'questionnaire'` **et** `challenge_event_id` = l'`event_id` de l'inscription, **et** la ligne apparaît dans l'**onglet « Demandes »** de `AdminBilans` avec son origine **lisible**.

### 2. Edge function « notification admin » (demandes hors-date) — **PROCHAINE TÂCHE**

**DÉCISION PRISE (11/09) : c'est un BALAYAGE, pas un envoi déclenché.**
Un job passe **toutes les 15 minutes**, lit les demandes `statut = 'en_attente' AND notified_at IS NULL`, envoie l'e-mail, puis marque `notified_at` — **sur succès seulement**.

**Pourquoi ce choix** : il n'y a **rien à installer** (⚠️ `pg_cron`, `pg_net`, `http` et le schéma `supabase_functions` sont **tous absents** de ce projet — vérifié), il **couvre les trois chemins** (questionnaire, créneau, hors-date), et l'onglet fermé ne perd rien : la demande est **déjà en base**. La latence de quelques minutes est sans objet — Catherine **valide à la main**.
*Écarté :* un **Database Webhook** (nécessite d'activer une extension + une config dans le dashboard = **hors repo**, à assumer comme telle) et un **déclenchement par le front** (un client qui ferme son onglet = **e-mail jamais envoyé**).

- **Pas de claim, pas de bail, pas de table de notifications.** On accepte un **doublon rare** (process mort entre l'acceptation Resend et le marquage), on **refuse la perte** — c'est le bon sens de l'erreur. La file de Catherine reste la vérité ; l'e-mail n'est qu'un confort, donc **borné** : si le job meurt, elle voit quand même ses demandes.
- **Lecture en `service_role` ou par connexion directe** (jamais `anon`) : la policy de `bilan_bookings` est « je lis les miennes » → un job en anon lirait **0 ligne, sans erreur**, et le symptôme serait « le job tourne, rien ne part ».
- **`verify_jwt = true` sur cette fonction** : on copie le **code** de `send-contact-email`, **pas sa config de vérification** (elle est en `false` **exprès** parce qu'un formulaire public l'appelle). Ici, `false` ouvrirait un **robinet à e-mails** sur la boîte de Catherine. Déploiement **nommément**, jamais « toutes les fonctions ».
- **Un e-mail par demande**, avec **le nom en objet** — pas un récapitulatif : elle traite une par une. *(Décision écrite, sinon on découvre le comportement au premier lundi chargé.)*
- **L'e-mail porte l'ACTION, pas seulement l'information** : nom, prénom, téléphone, origine, le challenge concerné — **et un bouton vers sa file** dans `admin.pessora.fr`. Un message sans geste, on s'en est interdit ailleurs.
- **Le job écrit sa trace à chaque passage**, et le **scan planning quotidien (8 h)** la lit → on apprend une panne en moins de 24 h **sans rien installer de plus**. ⚠️ Figer **ensemble** l'emplacement et le format de cette trace (le critère ⑤ et le critère ⑥ échouent **ensemble** si les deux ne s'accordent pas).
- **Critères (@vela)** : ① une demande → **un** e-mail · ② un **second** balayage → **aucun** second e-mail · ③ un envoi qui **échoue** → la ligne reste **non marquée** et le balayage suivant **réessaie** · ④ le job **laisse une trace** · ⑤ **on ne valide jamais le job par `exit 0`** : on crée une demande et on vérifie que **le balayage la voit**.
- **Propriétaire** : @alcyone (cron **script-only**, pas d'agent LLM sur un balayage de 15 min) — annoncé comme tel, et **config hors repo à documenter**.
- **Le test** est l'étape 6 de `docs/test-e2e-challenge-2026-09-11.md` — et il ferme le **dernier maillon Resend** (jusqu'ici prouvé **au câblage**, jamais **à la réception**).

### 3. `X-Robots-Tag` par chemin (`vercel.json`)
Dernier « petit » en suspens depuis plusieurs sessions (item 14 de la checklist go-live). Ordre impératif : (1) headers par chemin, (2) vérification **chemin par chemin**, (3) **ensuite seulement** lever le `noindex` global, puis régénérer le sitemap.

### 4. Lot `profils` — bug actif (migration séparée)
Un membre modifie son profil → l'interface dit « enregistré », **rien n'est écrit** (prouvé en live : `PATCH` → **204**, valeur inchangée). **5 profils sur 5** n'ont aucun numéro exploitable → c'est ce qui vide le pré-remplissage du téléphone à l'inscription.

- **Trigger `BEFORE INSERT OR UPDATE`** (pas UPDATE seul : `profiles_insert_own` existe en base et permet `role='admin'` sur une ligne absente).
- **Colonnes protégées** : `role`, `stripe_customer_id`, `email`, `created_at`/`updated_at`. Modifiables : `first_name`, `last_name`, `phone`, `avatar_url`, `preferences`, `admin_ui_prefs`.
- ⚠️ **« Policy self-update sans `role` » n'est pas exprimable en RLS** (la RLS est au niveau ligne, pas colonne) — d'où le trigger. Et **ne pas** révoquer la colonne à `authenticated` : Catherine EST `authenticated`.
- **La self-SELECT existe** (`GET profiles` en membre → 200) → le contrôle de lignes côté client est possible.
- **Règle des 9 chiffres** aussi sur le **formulaire de profil** (4ᵉ endroit) — module partagé `phone.ts`.
- **Recette** : `PATCH {"role":"admin"}` → rôle inchangé · `PATCH {"phone":"…"}` → **écrit pour de vrai** · non-régression : Catherine change un rôle depuis l'admin → ça marche toujours.

### 5. Passe conformité (après le lot A, en une fois)
- **Mentions légales** : raison sociale = *Catherine EDOUARD, entrepreneur individuel, enseigne PessÓra* · forme juridique = *Entrepreneur individuel* · **SIRET 941 411 159 00010** (absent aujourd'hui) · **directeur de la publication** = Catherine EDOUARD · **hébergeur** = *Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis* · adresse **légale** = le siège (`OSMAN NADEAU, RAVINE VILAINE, 97200 Fort-de-France`) — Cluny reste l'adresse **commerciale**.
- **⚠️ 17 occurrences de `pessora.fr@gmail.com`** (relevé du 11/09 : **12 fichiers**, `docs/` comprise) à remplacer par **`pessora.mq@gmail.com`** (décision de Ken) : `src/data/infoData.ts`, `CGV.tsx` (×2), `MentionsLegales.tsx` (×2), `PolitiqueConfidentialite.tsx` (×2), `AdminInfosBar.tsx` (placeholder), `send-contact-email/index.ts:63` (fallback en dur), `.env.example`, `docs/` (×3), **`template/client.config.ts`**. La base porte déjà la bonne adresse (`bar_settings.email`) → le site et le chatbot se contredisent aujourd'hui.
- **`template/client.config.ts` contient les coordonnées réelles de Catherine** (adresse du bar, lien Maps, email) → **tout doit devenir placeholder** (`contact@exemple.fr`, `00000`, Maps vide). Sinon chaque futur client publie les coordonnées d'un autre commerce. Critère : **zéro coordonnée réelle dans `template/`**.
- **Crédit footer** « Site réalisé par Karibloom » (avec l'accord de Catherine) — ligne typo fine, intégrée à la ligne légale.
- **Franchise de TVA** : la mention « **TVA non applicable, art. 293 B du CGI** » doit remplacer tout « **TTC** » ambigu. ⚠️ Il n'y en a **pas seulement dans les mentions légales** : le relevé live en trouve aussi dans **`/cgv`** (page où le client lit ses droits). Mesuré en rendu navigateur, pas dans le HTML brut.
- **`/confidentialite` ne porte AUCUNE adresse de contact** (page de 888 caractères, zéro e-mail) — or c'est la page où l'on exerce ses droits RGPD : y mettre **la même adresse arbitrée** que les mentions légales, sinon le droit d'accès n'a pas de voie affichée.
- **Les 4 `[À compléter]` visibles en production** (relevé live de `/mentions-legales`) : *Forme juridique*, *Directeur de la publication*, *Hébergeur*, *Adresse* (celle de l'hébergeur). Les autres pages légales (`/cgv`, `/confidentialite`, `/contact`) sont propres.
- 🔒 **Critères de recette de cette passe (contre-signature @vela — écrits AVANT la passe, pas après)** :
  1. **zéro occurrence de l'ancienne adresse dans TOUT le repo**, `docs/` comprise (`grep -rn` sur la racine, hors `node_modules`). ⚠️ **Ce critère est aujourd'hui INATTEIGNABLE tel qu'écrit** : le doc de consignes **et** la checklist go-live la citent eux-mêmes (relevé du 11/09 : **17 occurrences dans 12 fichiers**). Donc **on masque l'adresse dans les documents de pilotage** (`pessora[.]fr@gmail.com`) et le critère reste **absolu** — on ne l'affaiblit pas en « hors docs », sinon un oubli réel s'y cacherait ;

  2. **`template/client.config.ts` ne contient plus AUCUNE coordonnée réelle** de Catherine — ni adresse, ni lien Maps, ni e-mail, **ni Instagram, ni domaine, ni logo** (relevé : **14 lignes** marquées « ⟶ À CHANGER » : `brand`, `legalName`, `street`, `fullAddress`, `mapsUrl`, `email`, `instagram`, `instagramUrl`, `baseUrl`, `defaultTitle`, `ogImage`…). ⚠️ **Précision du critère** : il porte sur les **valeurs**, pas sur les commentaires — les commentaires d'exemple (« Base de référence : PessÓra ») restent légitimes, sinon le critère est lui aussi inatteignable ;

  3. **chaque valeur légale est vérifiée contre la fiche INSEE/INPI**, jamais contre notre propre rédaction (SIRET `941 411 159 00010`, siège ≠ Cluny, forme juridique) ;
  4. les pages légales sont contrôlées **rendues en live** (mentions légales, CGV, confidentialité) — pas seulement présentes dans le code : une page peut être écrite et ne jamais s'afficher ;
  5. **médiateur conditionnel** : tant que Catherine n'a pas désigné le sien, on ne met **rien** — jamais un médiateur inventé ou générique (une désignation fausse est pire qu'une absence) ;
  6. **et l'écart repo↔base est vérifié à la fin** de la passe : toute valeur corrigée doit exister **dans le repo ET en base** (ici la base porte déjà `bar_settings.email = pessora.mq@gmail.com` → le code doit la rejoindre, pas l'inverse).
  7. 🔴 **ET la fonction DÉPLOYÉE — pas seulement le repo** (trouvé par @alcyone, 11/09) : l'ancienne adresse est **codée en dur dans `send-contact-email`** (2 occurrences : le `from:` **et** le `to:` de repli). Donc remplacer les 17 occurrences **ne suffit pas** : il faut **redéployer la fonction**, sinon l'adresse **survit en production** et la passe rend un **faux vert**. Le contrôle se fait sur le **déployé** (version + `verify_jwt`), jamais sur le seul fichier du repo — c'est la même leçon que « les migrations ne sont pas la source de vérité de la base ».
- **Médiateur de la consommation** : obligatoire (L612-1 · L616-1/R616-1 · amende L641-1 jusqu'à 3 000 €). **C'est Catherine qui le désigne** → coordonnées à inscrire sur le site **et** dans les CGV dès qu'elle répond.
- **Newsletter conforme** : colonne `token uuid DEFAULT gen_random_uuid()`, **fonction de désinscription dédiée en `verify_jwt = false`** (déployée **nommément**), **`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`**, réponse **sans PII**, idempotente, rate-limitée. **DMARC absent** : `_dmarc.pessora.fr TXT "v=DMARC1; p=none"` (chez OVH). ⚠️ L'apex a un SPF **strict** (`include:mx.ovh.com -all`) → aucun envoi depuis `@pessora.fr` hors Resend.

---

## PAGE CHALLENGE — ajout de périmètre (décision de Ken, 11/09)

**Ce n'est PAS une page marketing isolée** : la route `/evenements/:slug` existe déjà et affiche un événement. Le travail consiste à **enrichir cette page quand le type est `challenge`** — un habillage de landing, dans la logique des autres événements. La décision du RDV (pas de page séparée) est donc **respectée**, et c'est **un ajout de périmètre**, pas un point du CR de Catherine.

- **Charpente** (référence FitStrong envoyée par Ken) : hero · 3 puces de réassurance · barre de chiffres · cartes · témoignages · CTA final. ⚠️ **On prend la charpente, PAS le style** — vert fluo/noir « salle de muscu » est rejeté : Pessóra est un bar wellness chic, on garde sa palette et son ton éditorial, avec une seule couleur d'accent.
- **Contenu** : il vient de la fiche papier de Catherine → **`docs/fiche-papier-challenge-21j.md`** (transcrite et vérifiée sur photo). Accroche de hero = **sa phrase** : « Quel est ton prochain objectif ? ». Les **6 éléments inclus** (GetFitNow · 24FIT PESSORA · séances · recettes · conseils · suivi) viennent d'elle, ils ne sont **pas inventés**.
- ~~🔴 La section « COMPLÉMENT DE REVENUS » est EXCLUE de la page et de tout formulaire en ligne.~~ → **⚠️ RÈGLE PÉRIMÉE LE 12/09 : REVIREMENT DE LA CLIENTE** (elle demande la section sur le site, en **choix simple**, sans fonctionnalité — tout est écrit dans la section dédiée en tête de ce doc : garde-fous, consentement, libellés). **L'historique est conservé exprès** : cette règle existait parce que le site fait la **vente** et pas le **recrutement** — et c'est **la cliente** qui décide de sa surface commerciale, nous non. **Ce qui reste interdit, et c'est la seule chose qui compte désormais : aucune promesse de gains** (ni montant, ni « gagnez X €/mois », ni témoignage de revenus).
- **Aucun formulaire nouveau** : la page est un habillage. Son CTA mène au **parcours d'inscription déjà recetté** (inscription → bilan obligatoire → créneau). Donc pas de nouvelle collecte, pas de nouvelle mention RGPD, pas de table à créer.
- **Trois blocs restent VIDES jusqu'aux vrais contenus de Catherine** : **chiffres**, **témoignages**, **photos avant/après**. Jamais de placeholder inventé, jamais de photo de banque d'images : ce serait de la **fausse preuve sociale** sur le site d'une commerçante.
- **Maquette et spec prêtes (Lyra, hors repo)** : `clients/pessora/page-challenge/maquette-challenge-21j.html` — **ouvrable au navigateur**, avec un **bouton de revue** pour basculer entre « challenge ouvert » et « aucun challenge » · `clients/pessora/page-challenge/DA-SPEC-challenge-21j.md` — la spec chiffrée (tokens pris dans `src/index.css`, règles dures, ordre des blocs) · captures 1440 + 390 en `clients/pessora/page-challenge/captures/` (en **600**).
- **Direction validée** : **Éditorial · Chaleureux · Sobre**. Un seul dispositif signature : **l'encadré « Challenge 21 jours »**, repris de la fiche papier (où c'est la seule zone encadrée). Accroche de hero = sa phrase.
- 🔴 **Règle de Lyra, à respecter absolument : un bloc de preuve vide ne se publie jamais.** Les 3 blocs (chiffres, avant/après, témoignages) restaient **invisibles en prod** tant qu'ils n'ont pas de contenu réel — dessinés vides, ils ressemblaient à des **blocs cassés** (défaut trouvé à la QA et corrigé dans la spec).
- **Les visuels à produire** — et la ligne de partage :
  - **à nous** (aucun risque, ambiance et structure uniquement) : **fond hero 1920×1080 + déclinaison mobile** · **6 icônes au trait** pour les items inclus · **OG image 1200×630** (l'aperçu quand le lien circule — on n'en a pas aujourd'hui) · **badge du mois** (mois calculé depuis la date du challenge — pas de mois en dur).
  - **à Catherine** : photos **avant/après** (droits), **témoignages** (jamais inventés, jamais une photo de banque d'images), **chiffres** (les vrais, ou pas de bloc).
  - ⚠️ **Jamais de preuve générée** : pas de visage, pas d'avis, pas de chiffre inventés.
- 🖼️ **Les 6 bannières « inclus » (série en cours, @user + @lyra) — règles verrouillées** : **aucun texte dans l'image** (le libellé vient de la **fiche, mot pour mot**, rendu **en HTML** : Application GetFitNow · communauté 24FIT PESSORA · séances de sport · idées recettes · conseils & accompagnement · suivi de tes objectifs) · **aucun logo, aucune interface lisible, aucun vêtement de marque** (GetFitNow et 24FIT PESSORA sont des **marques** : le téléphone est **face contre table**, avec un **shake Pessóra** à côté — un objet du quotidien, jamais un écran de pub) · **aucune promesse de résultat** (« suivi des objectifs » s'illustre par une **progression** — pierres empilées —, **jamais** une balance ni un mètre ruban) · **palette Pessóra** (pas de lime « GetFitNow », pas de studio blanc éclatant : les 6 vivent **dans la même lumière**) · **aucun visage identifiable**.
  - **Elles suivent le sort de l'encadré** : bloc « **challenge ouvert** » seulement → **absentes** dans l'état fermé **et** dans l'état passé (portes 7 et 8).
  - **Chaque image porte un `alt`** reprenant le libellé de la fiche, et **la référence externe (le visuel de marque GetFitNow pris sur leur site) n'entre JAMAIS dans le repo** : **on garde l'idée, pas le fichier**.
  - 🔴 **La carte SANS image — les invariants à coder (@lyra).** C'est ce qui rend « une aujourd'hui, cinq la semaine prochaine » invisible. **Sans image** : **aucun `<img>` du tout** (jamais d'image cassée, jamais de cadre vide) · **exactement la même hauteur et le même ratio 4:3** que la version illustrée · **fond sapin très désaturé** + **l'icône au trait centrée** (les 6 SVG existent déjà dans la maquette) · **le libellé à la même position** que dans la version illustrée. **Avec image** : `object-cover`, libellé posé dans la **zone calme** (d'où le négatif space à gauche demandé dans le bloc style). **Invariant à tenir : l'arrivée d'une image ne déplace AUCUN autre élément.** Et côté technique : `width`/`height` déclarés + `loading="lazy"` → **zéro saut de mise en page** (CLS). **L'icône ne disparaît pas** dans la version illustrée : elle reste en petit au-dessus du libellé — c'est elle qui fait la cohérence entre les deux états.
  - 🔴 **PORTE DE L'ÉTAT MIXTE (@vela) — à tirer dès la 1ʳᵉ image livrée.** C'est l'état qui va **réellement exister pendant des semaines** (3 images sur 6, puis 5 sur 6, jusqu'à la dernière) — pas l'état final. « Zéro saut de mise en page » et « l'icône reste » sont écrits ci-dessus comme des **intentions** ; la porte les transforme en **comptages** : **6 icônes présentes dans le DOM** avec ou sans image · **CLS mesuré = 0** après chargement des images · **aucune carte ne bouge** (comparaison des boîtes avant/après). Trois chiffres — parce que la transition doit être **invisible**, pas « censée l'être ».
  - ✅ **LES 6 IMAGES FINALES PASSENT LA VÉRIFICATION @VELA AVANT PUBLICATION** — sinon les règles ci-dessus restent **un prompt, c'est-à-dire une règle sans garde**. Cinq comptages, un par image : **lettres = 0 · marque ou logo reconnaissable = 0 · visage identifiable = 0 · écran d'interface = 0 · balance / mètre ruban / corps = 0**, **plus** la cohérence de lumière entre les six.
- 🔴 **SEO / OG — trois corrections PRÉEXISTANTES à faire dans la même passe** (@alcyone, chemins et comptage revérifiés par @elise) :
  - **① `index.html` : le logo est mort à TROIS endroits, pas deux.** `https://pessora.fr/logo.png` est référencé en `l.27` (`og:image`), `l.36` (`twitter:image`) **et `l.55` (le JSON-LD `"image"` — celui-là n'était pas relevé, et c'est celui que lisent les moteurs)**. Or **`logo.png` n'existe pas** dans `public/` (il n'y a que `logo.webp`, `logo-o.webp`, `logo-pessora.webp`, **identiques au md5 près** : `e3d6ad1c…`). → `https://www.pessora.fr/logo-pessora.webp`. ⚠️ Le fichier qui fait foi est **`logo-pessora.webp`** : c'est celui qu'utilisent `BrandLogo.tsx`, `seoConfig.ts` et le `preload` de `index.html:43`.
  - **② `src/components/common/PageSEO.tsx:71-72` ment sur les dimensions.** Il déclare `og:image:width = '1200'` et `height = '630'` **en dur**, alors que l'image par défaut (`seoConfig.ts:22`) est `logo-pessora.webp`, un **carré 1024×1024** → le scraper reçoit un carré en croyant recevoir du 1200×630, **letterbox sur tout lien partagé**. Correctif : ne plus déclarer en dur — déduire de l'image servie, ou porter les dimensions dans `seoConfig` **à côté de chaque `ogImage`**. ⚠️ **Ça existe déjà en prod**, indépendamment du challenge.
  - **③ `seoConfig.ts` est PAR PAGE** (`l.22` défaut, `l.37` « La Carte ») → `og-challenge-1200x630.png` doit être **une entrée propre pour la route challenge**, **pas** un remplacement du défaut : sinon **tout le site** partagerait l'image du challenge.
  - **Les trois se font ensemble** — sinon on répare l'aperçu du challenge en laissant le reste du site casser ses liens.
- ⚠️ **Lien partagé (ancre)** : le site gère les ancres **au clic** (`HeaderSubNav`), mais **`location.hash` n'est lu nulle part** — un lien `#challenge-21-jours` collé directement ouvrirait la page **en haut**, sans atteindre la rubrique. **À corriger** si on veut un lien partageable (post Instagram, QR au bar), et à vérifier **en navigation privée, lien collé**.
- 🔴 **RÈGLE OBLIGATOIRE — le fuseau (spec l.16 : `date >= aujourd'hui` n'était pas daté).** « Aujourd'hui » **ne se calcule jamais** avec `toISOString()` ni avec le fuseau du visiteur :
  - **un seul helper** : `new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date())` → rend bien `2026-09-11` ;
  - **jamais `toISOString().slice(0,10)`** — à **20 h 30 locale**, il renvoie **`2026-09-12`** alors que la Martinique est encore le 11 → la page **se ferme 4 h trop tôt**, et le challenge disparaît du site le soir du dernier jour ;
  - **jamais le fuseau du visiteur** (`toLocaleDateString()` sans `timeZone`) : un visiteur à Paris ouvrirait/fermerait la page avec **son** « aujourd'hui » — le même bug, déguisé ;
  - **même règle que la base**, qui fait déjà `(now() AT TIME ZONE 'America/Martinique')::date` → *une seule règle, un seul endroit*.
  - **Critère** : la borne **front** et la borne **base** disent la **même chose à 20 h 30 locale** ✅.
- 🔴 **RÈGLE OBLIGATOIRE — le vocabulaire vient de la fiche, pas de nous.** La fiche de Catherine dit **« Challenge 21 jours »**, et ses trois timings **« ce mois-ci · le mois prochain · je souhaite en savoir plus »**. Le mot **« vague »** n'est **pas d'elle** — c'est **notre** jargon (il traîne dans un de nos anciens docs), donc il ne va **nulle part** : ni sur la page, ni dans un **visuel**, ni dans un **e-mail client**, ni dans un libellé d'admin. Et **la source de vérité du texte est `docs/fiche-papier-challenge-21j.md`** — pas une maquette, pas une spec, pas un doc d'entrée : ce doc dit **où puiser**, la fiche dit **quoi écrire**.
- 🔴 **RÈGLE OBLIGATOIRE — aucune date sur la page qui ne soit une ligne en base.** La page affiche **les challenges qui existent en base** (`events` où `type='challenge' AND active=true`). S'il n'y en a aucun → « le prochain Challenge 21 jours ouvre bientôt » + newsletter. **Pas de liste de rythme en dur** (le « sept./oct. · janv. · mars » est **retiré** : Catherine n'a pas validé ce calendrier, et **le calendrier est chez elle**). Conséquence voulue : le jour où elle crée son challenge, il apparaît **sans qu'on touche au code**.
- **Non bloquant (@lyra)** : à 1440, le message d'erreur court sur **une ligne de ~850 px** — poser un `max-width` (~65-70 caractères) pour qu'il respire.
- **Trouvaille visuelle (@lyra, avec captures)** : **« ÓRA+ » est encore dans la navigation de l'espace membre** — sidebar desktop **et** barre du bas mobile — alors que l'archivage est total. À traiter dans la **passe Óra+**, les captures servant de preuve.
- **Séquencement** : le test E2E est **terminé** ✅ (base rendue au baseline) → **le front est libre**, la page challenge peut être codée. Le blocage restant est **le correctif du point 1 ci-dessus** (l'annulation de `MesBilans`), à passer **avant** le merge de sa branche.
- 🔴 **PRÉCÉDENCE — un arbitre par QUESTION, jamais un arbitre par document.** Trois documents coexistent pour cette page ; en cas de désaccord, c'est la **question** qui désigne qui tranche :
  - **`docs/CONSIGNES-CLAUDE.md` (ce doc)** → tout ce qui touche à **ce qui est vrai ou publiable** : fuseau, calendrier, **ce qu'on peut écrire sur le complément de revenus (0 promesse de gains)**, publication d'un bloc vide, route ;
  - **`clients/pessora/page-challenge/DA-SPEC-challenge-21j.md` (Lyra)** → les **valeurs visuelles mesurées** (tokens, tailles, hiérarchie, contraste) ;
  - **`docs/superpowers/specs/2026-09-11-challenge-21j-landing-design.md` (spec de build)** → l'**implémentation** (fichiers, ordre, requêtes).
  **Aucun document n'est « le bon » en bloc.** C'est le type d'écart qui a produit le faux chemin `/membre/bilans` : deux endroits, une seule règle — on vérifie le chemin, pas la confiance.
- 🔴 **3 alignements à faire DANS la spec de build AVANT de coder** (relevés par @vela, comparaison ligne à ligne) :
  1. **l.44** — *« Rythme des vagues : liste statique en dur pour ce lot »* **contredit la règle « aucune date qui ne soit une ligne en base »** → remplacer par la **requête en base** (l'état vide l.43 « ouvre bientôt » reste ✅) ;
  2. **l.16** — `date >= aujourd'hui` **ne dit pas quel « aujourd'hui »** → c'est la **règle de fuseau de ce doc** qui tranche, sinon on recode `toISOString()` ;
  3. **l.64** — les **cadres en pointillés décrits comme un rendu de prod** contredisent la règle de Lyra → **en prod, aucun pointillé** : le hero a un **dégradé de repli codé** (la page a l'air finie sans l'image), et les blocs de preuve sont **absents du DOM**, pas masqués en CSS. Le pointillé est un **repère de revue**, il vit dans la maquette.
- ✅ **Ce que les deux documents disent déjà la même chose** (donc stable, ne pas y toucher) : complément de revenus **autorisé en choix simple, avec son grep de contrôle requalifié (0 promesse de gains)** · blocs de preuve qui retournent `null` · ordre des routes (statique **avant** paramétrée) · **un seul écrivain** pour le parcours d'inscription · aucune promesse de résultat chiffré.
- 🔎 **LA RECETTE DE LA PAGE — 8 portes, toutes mesurables, aucune au jugé** (écrites et testées à blanc par @vela ; le détail d'exécution vit dans son script, les définitions ici) :
  1. **Précondition** — la page **rend bien le challenge** (H1 « introuvable » = portes **nulles**, pas vertes). *Une porte sans mesure n'est pas une porte verte* : ce défaut a été trouvé dans la sonde elle-même (elle rendait « 0 · 0 » sur un slug inexistant).
  2. **Pointillés = 0** — ⚠️ mesuré en **style calculé** (`getComputedStyle(e).borderStyle`), **jamais** par le nom de classe : la porte ① de la spec de build (l.118, `[class*="dashed"]`) **passerait avec un cadre pointillé défini dans une feuille de style** — faux vert de la famille. À corriger, ou à doubler par la mesure d'@vela.
     ⚠️ **Et scopé à la PAGE DU CHALLENGE, pas à tout `src/`** : les composants **admin** ont des `border-dashed` **légitimes** (zones d'upload — `EventGalleryManager`, `AdminProductGallery`, `DrinkDetailAdminEdit`). Mesurer la page, sinon **faux rouge**.
  3. **Blocs de preuve (chiffres, avant/après, témoignages) = 0** — **absents du DOM**, pas masqués en CSS, tant que Catherine n'a rien livré.
  4. **Contenu positif (@nova)** — ce qui doit être **là** : accroche = **sa phrase** (« Quel est ton prochain objectif ? ») · **6 puces « inclus »** mot pour mot (GetFitNow · 24FIT PESSORA · séances · recettes · conseils · suivi) · **3 timings** de démarrage · **CTA vers le parcours d'inscription existant** (aucune nouvelle collecte). Source : `docs/fiche-papier-challenge-21j.md`. *Sans porte positive, trois compteurs à « 0 » valident une page vide.*
  5. **Fuseau** — borne **front** et borne **base** disent la même chose **à 20 h 30 locale** (helper unique `src/lib/martiniqueDate.ts`).
  6. **390 px** — `scrollWidth === clientWidth` (zéro débordement horizontal) **et** **1** bloc encadré **portant le titre signature** (= 1), le compte brut des cadres restant **indicatif** : compter les cadres donnait **2 faux positifs sur une page saine** (une carte d'inscription, un champ de saisie) — *un dispositif signature se définit par son rôle, pas par sa bordure*.
  7. **État FERMÉ (aucun challenge en base) — la page doit dire la vérité** (règle **7bis** d'@lyra) : **absents du DOM** = l'**encadré signature** **et** le **CTA d'inscription** ; **présents** = le bloc **« prochain challenge + newsletter »**, **remonté juste après la réassurance**, et le **CTA du hero qui bascule sur « Être prévenu·e de l'ouverture »**. Toujours visibles : hero · réassurance · footer. *Défaut trouvé dans la maquette : l'état existait mais affichait quand même le contenu du challenge — un état qui ne dit pas la vérité.*
  ⚠️ **Les portes se tirent dans les DEUX états** (fermé **et** ouvert) : un vert sur l'état ouvert ne dit **rien** de l'état fermé. La maquette a le **bouton de revue** qui permute les deux — le même doit être utilisé sur la preview.
  8. **État PASSÉ — la porte qui manquait, et elle contredit la spec telle qu'écrite.** Relevé (@nova) sur la spec de build **l.27-28** : la route `/evenements/:slug` rend `<ChallengeLanding>` **sans aucun contrôle de fenêtre**, alors que la liste, elle, filtre `date >= aujourd'hui`. Conséquence : un **lien Instagram / QR au bar d'un challenge terminé continue de circuler** (cas certain, pas hypothétique) → la page proposerait de **s'inscrire à un challenge fini**. Donc **trois états, pas deux** :
     - **en cours** (`date >= aujourd'hui`, calculé en **Martinique**) → landing + **CTA d'inscription** ;
     - **aucun challenge en base** → page stable, état fermé (règle 7bis) ;
     - **challenge PASSÉ** → **le contenu reste** (la personne venue d'un vieux lien veut voir ce que c'était) **mais le CTA d'inscription disparaît**, remplacé par « **ce challenge est terminé — le prochain ouvre bientôt** » + newsletter. **Jamais** d'inscription à un challenge fini.
     **La règle de fenêtre s'applique aux DEUX portes d'entrée** (route stable **et** `/evenements/:slug`) : un slug ne contourne pas la fenêtre. **Porte 8** : sur un challenge à **date passée**, CTA d'inscription **absent du DOM** (= 0) et bloc « terminé / prochain » **présent**.
- 🎨 **« Fidélité au mockup » = 4 valeurs relevées sur le DOM (@lyra)** — ce n'est pas un jugement, ça se mesure :
  1. **titre hero ≤ 3,5 rem** (règle dure : pas de titre géant façon landing fitness) ;
  2. **rayon des blocs = 2 px** (le token du projet — une page en cartes arrondies, et on a perdu l'ADN Pessóra) ;
  3. **un seul accent : le vert sapin `#1E3529`**, jamais une deuxième couleur de mise en avant ;
  4. **respiration de section ≥ 6,5 rem en desktop** (c'est ce qui fait le « sobre » ; tassé, ça devient une page promo).
  **Reste au seul jugement d'@lyra : la composition** — et elle vient **après** ces 4 valeurs, jamais à leur place.

---

## 🔴 À LA REPRISE — page Challenge 21 jours (revue statique du 11/09 au soir, branche `feat/challenge-21j-landing`)

> ⚠️ **SECTION HISTORIQUE — état au 11/09 au soir.** Depuis, les points 1 à 4 ont été **faits et vérifiés** (`4048075` : porte 8 côté bouton, « vague » purgé, « Places limitées » retiré, lien confidentialité en noir 70 %, emplacement des bannières posé). **Pour l'état réel, lire l'ORDRE DU JOUR en tête de ce doc (§1 : ce qui est fait ✅ / ce qui reste).** Ce qui suit garde la valeur d'une trace : **pourquoi** chaque point existait.

Revue statique faite par @elise (23 fichiers, **2 704 insertions**) — **la branche est bien construite** ; reste ceci **avant merge/PR** :

1. 🔴 **La porte 8 n'est PAS implémentée** — `ChallengeLanding` ne reçoit **aucun état de date** et rend `<ChallengeRegistrationCard>` **inconditionnellement** ; `EvenementDetail.tsx:122` monte `<ChallengeLanding>` **sans contrôle de fenêtre** → un vieux lien Instagram / QR au bar d'un challenge **terminé** propose encore de s'inscrire. *(La route stable est protégée par sa requête ; c'est le **slug** qui contourne.)* → appliquer la fenêtre **aux deux portes d'entrée**, **et** rendre **les timings absents du DOM** dans l'état passé (ajout @lyra : la rangée « Ce mois-ci / Le mois prochain » **ment aussi** au milieu de la page, pas seulement le bouton du bas).
2. 🔴 **Le mot « vague » est affiché à l'écran** — `ChallengeHero.tsx:26` (« Challenge 21 jours · **Vague de** {mois} ») et `ChallengeClosedState.tsx:15` (« **Prochaine vague** »). Le mois vient de `event.date` (propre) ; **seule la formule est à changer** → « Challenge 21 jours » / « prochain challenge ». Claude a codé sur la maquette **d'avant la purge** : **mécanique, pas un choix**.
3. ⚠️ **Deux portes à ne pas mal scoper** (sinon faux rouges) : la porte « Herbalife » **a changé de cible le 12/09** : elle ne vise plus **le sujet** (la section est désormais voulue par la cliente) mais **la promesse de gains** (« gagnez X € », montant, revenu complémentaire chiffré, témoignage de revenus) **et** l'absence de la mention « **distribution indépendante — ni emploi ni salaire** ». ⚠️ Toujours **pas la marque** (`productsData.ts` / `ProductJsonLd.tsx` = **38 occurrences légitimes**, ce sont **les produits vendus**) ; et la porte « pointillés » est **scopée à la page du challenge** (les zones d'upload de l'admin sont légitimes).
4. 🐛 **Même famille, hors lot** : `src/lib/siteAnnouncement.ts:6` fait `new Date().toISOString().slice(0,10)` → **le bandeau d'annonce du site bascule au jour suivant dès 20 h locale**. La règle de fuseau qu'on vient d'écrire est donc **déjà violée ailleurs dans le code** : à corriger avec le même helper (`src/lib/martiniqueDate.ts`) — **dette écrite**, même famille que la borne front/base.
5. 🎨 **Accent doré/vert : tranché** — voir le point 8 (le doré est un **ornement**, pas un accent).
6. ⏭️ **Reste du process** : la **revue finale de branche** (interrompue avant résultat), puis **finishing-a-development-branch** (merge/PR). **Pas de merge sans les 8 portes tirées sur la preview** *ni* **l'œil d'@lyra**.
7. 🎨 **Deux corrections de forme tranchées par @lyra** (mesurées, pas d'opinion) : **①** le lien « **politique de confidentialité** » (11 px, `gold-dim` 4,54:1) **sort du doré** → c'est du **texte d'action juridique**, il passe en **noir 70 % souligné (7,57:1)** ou en sapin ; **②** « **Places limitées** » (`text-[8px]`, dans l'encadré signature) : 8 px est **sous le plancher de lisibilité**, et c'est **une affirmation de rareté** → ⚠️ **la fiche de Catherine ne dit pas un mot de places limitées**, donc en l'état **elle saute** (elle ne revient que si Catherine l'affirme — et alors ≥ 11 px, hors doré).
8. ✅ **Accent tranché, par rôle** : **`sapin` #1E3529 = le seul accent sémantique** (documenté comme tel dans `index.css`, 67 fichiers, **13,15:1** sur blanc) ; **`gold` = ornement** (**2,26:1 — échec AA**, jamais de texte ; `gold-dim` 4,54:1 réservé aux micro-libellés). Vérifié sur la branche : **aucun `text-gold` plein**, et **aucun doré signifiant en double** dans un même bloc ✅.

---

## ⏱️ MINUTEUR DE LANCEMENT — ajout de périmètre (décision de Ken, 12/09)

**Demande de Ken :** un **compte à rebours vers le lancement du challenge**, sur le modèle du minuteur « Pizza du Chef » de Dalcielo. **Cible tranchée : J** — le jour où le challenge commence (pas J-14, l'ouverture des créneaux).

### 1. Ce qu'on reprend de Dalcielo (pattern éprouvé, en prod)

Référence : `repos/dalcielo/src/components/ui/ChefValidUntilTimer.tsx` + `src/lib/chefOffer.ts`.

- **un champ date au format `YYYY-MM-DD`** posé côté admin — ici, **`events.date`**, qui existe déjà : **aucune colonne à créer** ;
- **l'affichage : 4 cases `JJ · HH · MM · SS`**, avec **`tabular-nums`** (les chiffres ne sautent pas) et **`padStart(2,'0')`** ;
- **la case des secondes qui pulse** ;
- **la garde d'entrée : date absente ou malformée → `return null`** — pas de zéro, pas de tiret, **rien dans le DOM** ;
- **l'état passé : un libellé court** (« terminé »), jamais un décompte négatif.

### 2. 🔴 LE PIÈGE — ne PAS copier le calcul de Dalcielo

Dalcielo calcule son échéance avec `new Date(y, m-1, d, 23,59,59)` — c'est-à-dire **dans le fuseau du navigateur**. **Transposé ici, c'est exactement la faute que la règle de fuseau de ce doc interdit** (l. 265-270) : un visiteur à Paris verrait l'échéance décalée de 4 à 5 heures.

**Règle qui s'applique, sans exception :**

- **l'échéance se calcule en `America/Martinique`**, jamais dans le fuseau du visiteur, jamais en UTC ;
- **jamais `toISOString()`, jamais `toLocaleDateString()` sans `timeZone`** ;
- **même règle que la base** : `(now() AT TIME ZONE 'America/Martinique')`.

### 3. ⚠️ Le helper existant NE SUFFIT PAS — il faut l'étendre

`src/lib/martiniqueDate.ts` ne sait faire qu'une chose :

```ts
export function todayInMartinique(): string {   // → '2026-09-12'
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Martinique' }).format(new Date());
}
```

Or un compte à rebours a besoin d'un **instant** (un `Date` comparable), pas d'une chaîne `YYYY-MM-DD`. **Forme TRANCHÉE par @alcyone — une seule export en plus, pas de refonte :**

```ts
// events.date est une DATE naïve ('YYYY-MM-DD'), pas un horodatage.
// America/Martinique = -04:00 SANS heure d'été DEPUIS 1980 (vérifié 2024→2100 par
// @vela) ; -05:00 existait avant 1980. Le littéral est donc sûr pour nos dates,
// mais il n'est pas "permanent depuis toujours".
// Pas d'heure d'été = pas de calcul d'offset — c'est précisément ce calcul qui
// produit le bug Dalcielo.
export function startOfDayMartinique(date: string): Date {
  return new Date(`${date}T00:00:00-04:00`);
}
```

**Pourquoi cette forme rend le bug structurellement impossible** (et pas « attention au fuseau ») : le décompte devient `startOfDayMartinique(events.date).getTime() - Date.now()` → **deux instants absolus**. Un `Date` **est** un instant, il n'a pas de fuseau : un visiteur à Paris et un à Fort-de-France calculent **le même** `remaining`. Il n'y a **aucun `timeZone` dans le calcul**, donc rien qui puisse diverger — l'invariant est dans le code, pas dans une consigne.

⚠️ **`todayInMartinique()` reste** (la chaîne `'YYYY-MM-DD'`) pour les comparaisons du landing (`date >= aujourd'hui`). **Deux fonctions, deux métiers** — ne pas en surcharger une pour l'autre, sinon on recrée l'ambiguïté « date vs instant ».

**Le test doit être FALSIFIABLE** (⚠️ comparer `startOfDayMartinique(x)` au littéral `new Date(x + 'T00:00:00-04:00')` compare **le même littéral à lui-même** : un offset faux passerait **vert**). Forme retenue :

```ts
const t = startOfDayMartinique('2026-09-16');
const hm = (d: Date) => new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'America/Martinique', hour: '2-digit', minute: '2-digit',
  hour12: false, hourCycle: 'h23',   // ⚠️ sans hourCycle, certaines versions d'ICU rendent '24:00'
}).format(d);
expect(hm(t)).toBe('00:00');                            // vu de Martinique = début du jour
expect(hm(new Date(t.getTime() - 1))).toContain('23:59'); // 1 ms avant = la veille
```
Avec un offset en `-05:00`, ce test **rougit** (il lirait 23:00 puis 22:59) → il mesure vraiment ce qu'il prétend. Variante inattaquable, si on préfère : `expect(startOfDayMartinique('2026-09-16').toISOString()).toBe('2026-09-16T04:00:00.000Z')`.

⚠️ **Et le cran d'écart VOULU, à écrire en commentaire dans `ChallengeCountdown.tsx`** — la même page porte deux définitions de « maintenant » : l'**état** du landing est `date >= aujourd'hui` (le jour J appartient encore au challenge ✅) alors que le **minuteur** disparaît dès `remaining > 0` **strict** (il s'efface exactement quand l'état bascule). Les deux sont justes, mais **elles divergent d'un cran au même endroit** → sans commentaire, le premier refactor fera dériver l'une des deux, et personne ne verra d'erreur : juste un décompte qui survit d'une journée.

⚠️ **Le test existant (`src/__tests__/martiniqueDate.test.ts`) doit être étendu**, pas contourné : c'est lui qui garantit qu'à **20 h 30 locale** le front et la base disent la même chose.

**Défaut proposé : l'échéance = le DÉBUT du jour J en Martinique** (le lancement, c'est le début de la journée). À valider par Ken si l'ouverture réelle se fait à une heure précise.

### 4. Où il vit, et dans quels états

**Composant dédié**, dans la famille existante : `src/components/events/ChallengeCountdown.tsx`. **Il ne calcule rien** — il reçoit une date et rend le décompte.

| État | Le minuteur |
|---|---|
| **Challenge à venir** (`date` en base, J dans le futur) | **Affiché** — « Le prochain Challenge 21 jours commence dans… » |
| **Aucun challenge en base** | **Absent du DOM** (`return null`) — pas d'échéance, donc pas de minuteur |
| **Challenge passé / en cours** | **Absent du DOM** — cohérent avec la porte 8 : on n'annonce pas un lancement déjà eu lieu |

**⚠️ Bénéfice à ne pas gâcher :** aujourd'hui, **avant J-14**, la page n'a **aucun chemin** — la fenêtre d'inscription n'est pas ouverte, et il n'y a rien à proposer au visiteur. **Le minuteur comble ce trou** : il donne une date et une raison de revenir → c'est lui qui rend l'état « bientôt » vivant, et qui donne sa cible à la newsletter.

**⚠️ Anti-hydratation, obligatoire :** comme chez Dalcielo, le décompte ne s'affiche **qu'après le montage client** (`mounted`). Serveur et navigateur ne voient pas la même seconde — sans cette garde, React signale une erreur d'hydratation.

### 4bis. 🔴 Le minuteur n'est PAS un deuxième dispositif signature (règles @lyra, mesurables)

La page a **un seul** dispositif signature : **l'encadré Challenge**. Un compte à rebours se transforme vite en **enseigne lumineuse**, et on bascule dans le look « promo / offre flash » — l'inverse de la direction. Donc :

- **Traitement d'information, pas d'urgence** : **pas de rouge, pas de cadre, pas de halo, pas d'or** (l'or reste un ornement ≤ 1 px — filets, points). Chiffres en **noir ou sapin**.
- **`tabular-nums`** obligatoire : les chiffres ne doivent pas bouger d'une seconde à l'autre.
- **Hiérarchie** : corps des unités **≤ 13 px**, et les chiffres **nettement sous le H1** (3,375 rem) — **le minuteur s'aligne sur le titre, jamais l'inverse**.
- **La pulsation des secondes** = variation d'**opacité légère** — **pas** de rebond d'échelle. C'est un pouls, pas une animation de foire. Et elle se **désactive sous `prefers-reduced-motion`**.
- **Placement** : dans l'état « le prochain Challenge 21 jours ouvre bientôt » — c'est là qu'il sert, et là qu'il ne vole la vedette à rien.

**Test de recette associé** : si le minuteur devient un encadré doré au milieu du hero, la page a **deux points focaux** et le « sobre » tenu trois jours est perdu.

### 5. 🔴 Ce que le minuteur ne doit PAS réintroduire

- **Aucun mois à l'écran, aucune liste de rythme, aucune date qui ne soit pas une ligne en base** (règle l. 272) — le minuteur **lit** `events.date`, il n'annonce rien d'autre ;
- **le mot « vague » reste banni** — le libellé est « Challenge 21 jours », jamais « prochaine vague ». *(Le minuteur est exactement l'endroit où ce mot reviendrait par réflexe.)*
- **aucune promesse de résultat** — le décompte annonce un **début**, jamais un effet.

### 6. Portes de recette ajoutées (@vela) — les 8 précédentes restent dues

**Porte 9 — le minuteur est absent du DOM quand il n'a pas d'échéance.**
Aucun challenge en base, **et** challenge passé → **compteur = 0**. Vérifier l'absence, **pas** un affichage masqué en CSS.

**Porte 10 — la porte de fuseau, appliquée au minuteur.**
Elle est **structurelle** (forme @alcyone) : le décompte doit être **identique** avec le fuseau du navigateur réglé sur **`Europe/Paris`** et sur **`America/Martinique`** — parce qu'il n'y a **aucun `timeZone` dans le calcul** (deux instants absolus). En complément, horloge réglée **à 20 h 30 locale Martinique** (= 00 h 30 UTC le lendemain) : **le nombre de jours ne doit pas avoir changé d'un cran**. ⚠️ Si la porte passe « parce qu'il n'y a rien à faire diverger », le noter — **c'est le résultat attendu**, pas une porte inutile.

**Porte 11 — l'échéance atteinte ne ment pas.**
Simuler un `now` postérieur à J : le décompte **disparaît ou passe à l'état passé**, il n'affiche **jamais** `-01 j` ni `00 j 00 h 00 s` figé.

**Porte 12 — la traversée de minuit, sans rechargement (@vela).**
Playwright 1.60 expose `page.clock` ✅ : régler l'horloge à **23 h 59 min 30 s**, lire le décompte, avancer à **00 h 00 min 30 s**, et exiger **la même chose qu'après un rechargement** — le minuteur disparaît **et** la page a basculé d'état. C'est le seul scénario où un visiteur qui **laisse l'onglet ouvert** (le cas d'un lien Instagram) voit autre chose qu'un visiteur qui arrive.
⚠️ **Et il n'y a rien à assumer ici** : le minuteur **tick déjà** (les secondes pulsent) → s'il recalcule `remaining` depuis `Date.now()` à chaque tick au lieu de figer l'échéance au montage, la traversée est **automatique**. La porte ne sert qu'à vérifier qu'on n'a pas figé ce qui ne doit pas l'être.

**Compléments, mesurables :**
- **390 px** — `scrollWidth === clientWidth` avec le minuteur affiché (4 cases + libellé : c'est là que ça déborde) ;
- **console propre** — zéro avertissement d'hydratation au chargement ;
- **`prefers-reduced-motion`** — la pulsation des secondes doit se désactiver (accessibilité) ;
- **pointillés = 0** — le minuteur ne se dessine **jamais** en pointillés : il a une valeur réelle ou il n'existe pas.

### 7. Points à trancher avant de coder

1. **L'échéance** : début de J (proposé) ou une heure précise si Catherine en fixe une ?
2. **Le libellé exact** du décompte — « Le prochain Challenge 21 jours commence dans… » : à valider (il n'annonce rien de plus que la date en base).
3. **@alcyone** : la forme retenue pour l'extension de `martiniqueDate.ts` (§3).

---

## DETTE ÉCRITE (ne pas confondre avec « à faire »)
- 🕐 **Famille `toISOString()` = « aujourd'hui » calculé en UTC — bug site-wide, mesuré (@alcyone, 11/09).** Le helper `src/lib/martiniqueDate.ts` (`todayInMartinique()`) écrit pour la page challenge est **le fix** ; or le même pattern `new Date().toISOString().slice(0,10)` / `.split('T')[0]` est **déjà violé à ~10 endroits à impact client** (bascule au jour suivant dès 20 h locale) : `siteAnnouncement.ts:6` (bandeau) · `BilanBienEtre.tsx:173` + `:245` (créneaux + date min) · `Evenements.tsx:241` (liste) · `member/MesEvenements.tsx:84` (inscriptions) · `HeaderSearch.tsx:103` + `useSearch.ts:49` + `useUpcomingEvents.ts:30` (recherche + à venir) · `admin/RetraitsGamme.tsx:39` (retrait) · `admin/AdminOverview.tsx:89` (stats). **Cosmétique** (nom de CSV, date d'abonnement) : `AdminProduits`, `AdminCommunications`, `AdminEvenements`, `AdminMembers`, `AdminMemberDetail:182/288`. **Cas distinct — ne pas confondre** : `AnalyticsDashboard.tsx:53` reconvertit un `created_at` stocké. **À corriger en une passe, avec le helper unique** — pas instance par instance.

- 🔤 **Lisibilité de l'admin et de l'espace membre — chantier à part entière, mesuré (@lyra, 11/09 ; signalé par @user).** Les textes de modification/labels sont **en gris pâle sur fond clair** : contrastes calculés — `/30` = **2,03:1** · `/35` = 2,35 · `/40` = 2,71 · `/45` = 3,15 · `/50` = 3,74 · `/55` = 4,42 → **tous échecs AA (4,5:1)** ; seuls `/60` (5,25:1) et `/70` (7,57:1) passent, et le projet les utilise déjà. Le motif est localisé : **`labelBase` = `text-[9px] text-black/45` (9 px à 3,15:1) porte TOUS les libellés de champs de l'admin** ; les actions sont au même niveau (« Annuler »/« Non » et le crayon de modification en 9 px `/45`, le ✎ des boosters en 9 px `/30` = 2,03:1, la corbeille en `/20` = 1,44:1). **Périmètre : 412 usages** de gris sous 60 % dans l'admin + l'espace membre (`/40` ×100, `/35` ×80, `/45` ×79, `/30` ×51, `/55` ×41, `/50` ×38). **La règle, en une ligne : aucun texte sous 60 % de noir sur fond clair dans l'admin, et aucune action sous 10 px** — *la teinte pâle et le corps minuscule se cumulent, c'est ça qui rend illisible*. **À traiter par tokens (`labelBase` en premier : une ligne corrige des dizaines d'écrans), pas par balayage** — et **pas** dans le lot de la page 21J.
- **~25 tables** portent le `GRANT ALL` hérité Supabase (INSERT/UPDATE/DELETE pour `anon`/`authenticated`) protégées **uniquement par l'absence de policy**. Non exploitable aujourd'hui. **Priorité avant la bascule Stripe live** : `orders`, `order_items`, `subscriptions` (données d'argent) → `profiles` (avec son lot) → le reste. À traiter **avec le test de la vraie action**, jamais en relisant les `GRANT`.
- **`bilan_slots` garde son `GRANT ALL`** alors que `bilan_bookings` est resserré → asymétrie assumée, à ne pas confondre avec « les deux tables sont protégées pareil ».
- **Les 2 vues `v_pessobot_*`** portent INSERT/UPDATE/DELETE sans objet : testé en anon → **aucun contournement de RLS** (`42501` / ligne intacte). Privilèges à nettoyer, pas un trou.
- **`P0002`/`P0003` sortent en HTTP 500** (PostgREST ne connaît pas ces codes) → le front mappe sur **`error.code`**, jamais sur le statut HTTP ni sur le texte du message.
- **« Saisie manuelle au bar »** : la policy le permet (`Admins manage bilan_bookings`, `ALL`), **aucun écran ne le propose**. Manque de fonctionnalité, pas une régression. Si un jour un écran admin insère : poser `statut = 'confirme'` (hors du prédicat de l'index de dédup → aucune friction).
- **`bilan_slots` n'a pas de lien vers un événement** pour les créneaux historiques : les 7 créneaux legacy sont orphelins (dates passées).
- **Notification e-mail des demandes hors-date** : à ne câbler qu'avec la borne (rate-limit + dédup en base) — sinon un visiteur peut remplir la boîte de Catherine.

---

## EN ATTENTE DE CATHERINE (rien à coder)

1. **Sa carte complète** (catégorie + prix par produit) → débloque les 3 catégories (MEGA THÉ / PROTEIN SHAKE / COFFEE), les prix (Mega Thé 600 cl 10 €, Shake Grand 14 €), le moteur Formules, et PessoBot v2. **C'est le plus gros morceau restant.**
2. **Son médiateur de la consommation.**
3. **Son accord** pour le crédit footer.
4. **Le lien Easy Ta Vie.**
5. **La recette du module « Bilan » dans son admin** (elle est la seule à pouvoir juger).
6. **Deux visuels manquants à la carte** — **TIRAMISU GOURMAND** (shakes) et **DETOX MY BODY** (wellness) ont `image_url = null`. ✅ **Vérifié dans le code : ce n'est PAS une image cassée** — le rendu public gère l'absence (`HomeProductCarousel.tsx:52` : `imageSrc ? <img/> : placeholder`), donc le visiteur voit un **placeholder**, pas un carré brisé. Ce n'est donc **pas un bug à corriger de notre côté** : c'est **deux produits affichés sans leur visuel**. Deux questions pour elle, dans cet ordre : **① ces boissons sont-elles toujours à sa carte ?** (si non → on **retire** le produit, cf. skill `retrait-offre-site-client`) · **② si oui → c'est son visuel qu'il faut** (photos de ses propres boissons, téléversées via le champ image de l'admin — les 14 autres vivent dans le bucket **`product-images`**, `.webp`, ~39 Ko, jamais des PNG de 2 Mo dans le repo).

---

## GO-LIVE — voir `docs/CHECKLIST-GO-LIVE-PESSORA.md`

Purge des données de test (8 inscriptions `TEST-VELA`, comptes QA, lignes `cs_test_…`, fixtures) · bascule **Stripe live** · `ADMIN_EMAIL` → `pessora.mq@gmail.com` · **compte admin réel** de Catherine (aujourd'hui `admin@pessora.mq` fictif + mot de passe faible) · **lever le noindex** (après les `X-Robots-Tag`) · **PAT Supabase expire le 16/11/2026**.
