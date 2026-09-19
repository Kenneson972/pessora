# PESSÓRA — message à Catherine : le carton A6 + le médiateur (19/09/2026)

**Statut : GARDÉ NON ENVOYÉ.** Écrit par @nova le **samedi 19/09/2026** (date vérifiée : `date` → Saturday 19/09/2026, AST).
Nova n'a **aucun canal client direct** : ce message est **transmis par Ken (WhatsApp)**, sur son go.
Registre aligné sur le message de clôture du 10/09/2026 (`pessora-message-cloture-2026-09-10.md` : « Bonjour Catherine » + tutoiement).

**Il ne part pas tel quel** : la ligne ① dépend de l'arbitrage **A / B** de Ken, et le document ne se veut pas
imprimable tant que la phrase de Catherine n'est pas là.

## Les trois demandes (maximum tenu : 3)

| # | Demande | Ce qu'elle débloque |
|---|---|---|
| ① | **Sa phrase** pour le carton | le texte du carton A6 (aujourd'hui un emplacement) |
| ② | **Son médiateur de la consommation** (L612-1) | l'ouverture au public — obligation légale, 0 occurrence sur le site |
| ③ | **La période de sa prochaine vague** | la date d'impression : le QR ouvre le challenge **en cours** |

Ce qui **ne** part **pas** dans ce message : le solde (250 €) et l'abonnement (49 €/mois) — annonce à froid,
séparée (`kb-client-relances`). Aucun montant, aucun décompte, aucun chiffre non revérifié.

## Décisions du 19/09/2026 (Élise) — intégrées dans le corps ci-dessous

- **③ est gardée** : c'est Catherine qui pose ses dates depuis le 10/09, et sans sa période la carte s'imprime
  sur un challenge peut-être déjà fini.
- **Les « deux ou trois versions, la plus courte d'abord » sont validées** : ça évite un aller-retour à Catherine
  et ça ne rogne jamais ses mots. **Ça ne remplace pas la garde de largeur** — la garde reste et doit refuser
  à voix haute ; la différence est qu'elle ne devrait plus jamais avoir à refuser **ce qu'on a demandé**.
- **Le budget part en millimètres, après l'arbitrage A/B** — jamais en compte de caractères.

## La ligne ① — deux versions, à substituer après l'arbitrage A/B

Mesuré (@vela, le 19/09) : la zone utile fait **75 mm**, la phrase s'imprime en **71 mm de large maximum par ligne**.

- **Variante A (emblème seul)** ← recommandée par @lyra et @elise : **3 lignes** tiennent, la 3ᵉ à 63,4–66,9 mm.
  - → `ta phrase doit tenir en 3 lignes sur la largeur du carton (71 mm par ligne)`
- **Variante B (emblème + mot-symbole)** : **2 lignes** seulement — la 3ᵉ tombe dans la zone du QR (effacée, sans erreur).
  - → `ta phrase doit tenir en 2 lignes sur la largeur du carton (71 mm par ligne)`

⚠️ **Ce qui n'est PAS écrit dans le message** (et ne doit pas y aller) : « ~80 caractères ». Un compte de signes
peut être respecté **et** casser quand même — 74 signes de lettres larges (M/W/O) prennent 3 lignes comme
112 signes de français courant. C'est une **largeur** qui contraint, pas un nombre de signes.
La garde du script doit **refuser à voix haute** (choix acté en salle) : aujourd'hui un dépassement s'efface en silence.

---

# MESSAGE (corps, prêt à transmettre)

**Bonjour Catherine,**

Deux ou trois petites choses et on lance ton carton d'invitation pour les vagues de 21 jours. 👋

**① Ta phrase.**
Le carton porte une phrase de toi, au-dessus du QR qui renvoie vers ta page Challenge — c'est le premier mot
que les gens lisent. Elle est imprimée telle quelle, donc il lui faut **<BUDGET — ligne A ou B ci-dessus>**.
Le plus simple : envoie-moi **deux ou trois versions**, la plus courte d'abord — je mets en page celle qui
tombe le mieux. **Je ne coupe jamais tes mots.**

**② Ton médiateur de la consommation.**
Ton site vend en ligne à des particuliers, et la loi oblige tout professionnel dans ce cas à **désigner un
médiateur de la consommation** et à afficher son nom et ses coordonnées dans les mentions légales (article L612-1).
Si tu en as déjà un, donne-moi juste **son nom et son site** (souvent c'est ton assurance pro ou ton
organisation professionnelle qui le fournit). Si tu n'en as pas, dis-le moi et on t'explique comment en désigner un —
c'est une ligne à corriger sur le site, on s'en occupe dès qu'on l'a.

**③ Ta prochaine vague.**
Le QR du carton ouvre la page de ton challenge en cours : dis-moi **la période que tu vises** et on imprime
juste avant, comme ça le carton tombe toujours sur le bon challenge.

Je te joins un aperçu du carton pour que tu voies la place de la phrase — dis-moi ce que tu en penses.

---

## Ce qu'il reste à faire avant que ce message puisse partir

1. **@user — arbitrage A ou B** (ligne ① : 3 lignes ou 2 lignes). @lyra et @elise recommandent **A**.
2. **@lyra — l'aperçu joint au message** : **c'est fait**, et il est **pinné ici** pour que personne ne joigne un autre fichier.
   - Les deux aperçus vivent sur la branche **`lot/lyra-apercu-carte-a6` = `e1ba614`** (construite sur `lot/nova-carte-a6`) :
     prendre l'image **à ce SHA**, pas « la dernière version ».
   - Variante **A** : `docs/carte-invitation-a6/variante-embleme/apercu-A-embleme-seul.png`
     — sha256 `a0b4e8d16975996a…` (48 038 o)
   - Variante **B** : `docs/carte-invitation-a6/variante-embleme/apercu-B-embleme-mot-symbole.png`
     — sha256 `e98d48c6ca934fd6…` (50 174 o)
   - Les deux sont **sans la mention interne `NON imprimable`** (vérifié dans les pixels par @lyra, puis re-rendus
     à l'identique après le passage de la garde au maximum des deux moteurs).
   - ⚠️ **Ce qui part est l'aperçu, jamais le PDF d'impression** : le PDF du lot porte encore l'emplacement et
     s'annonce non imprimable dans son propre dessin.
3. **@user — go d'envoi.** Tant qu'il n'est pas donné, ce fichier ne quitte pas le dépôt.

## Si la carte ne part pas finalement (arbitrage de @user)

Le carton est **notre** proposition, pas une demande de Catherine ni une idée de son brainstorm : rien n'est parti,
aucun tirage n'est lancé, elle n'en a pas entendu parler. Ken peut donc l'arrêter — mais **les trois demandes
n'ont pas le même sort** :

- **① sa phrase tombe avec le carton.** Elle n'existe que pour la carte : si la carte s'arrête, on ne la demande pas.
- **② son médiateur (L612-1) NE TOMBE PAS.** C'est une **obligation légale** pour un site qui vend à des particuliers,
  **reclassée le 18/09** du seau « à la remise, oral » vers « **préalable à l'ouverture au public** » précisément parce
  qu'elle ne peut pas attendre. Elle a voyagé avec la carte par commodité, **pas par dépendance**.
- **③ la période de sa prochaine vague ne tombe pas non plus** : elle sert à l'impression *et* à l'ouverture.

→ **Si la carte s'arrête, ce message se coupe en deux** : ② et ③ rejoignent la demande « carte des boissons »
(même guichet client, déjà ouverte) au lieu de disparaître. **Un préalable légal ne s'attache jamais au sort
d'une pièce de communication.**
