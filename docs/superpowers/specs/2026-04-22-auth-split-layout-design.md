# Connexion / Inscription — layout split (vidéo + formulaire)

## Décisions validées

| Sujet | Choix |
|--------|--------|
| Structure | **Split** : colonne **gauche** = zone **vidéo** (atmosphère marque), colonne **droite** = **formulaire** auth (connexion ou inscription). |
| Mobile | **Option 1** : **vidéo en haut**, **formulaire en dessous** (ordre visuel cohérent avec « gauche = vidéo » en lecture LTR une fois empilé). |
| Desktop | Deux colonnes **pleine hauteur** (`min-h-screen`), pas de scroll horizontal ; la colonne droite peut scroller si le contenu (ex. inscription) dépasse la viewport. |
| Breakpoint split | **`lg` (1024px)** : en dessous, empilement vertical ; à partir de `lg`, grille 2 colonnes. *(Évite un formulaire trop étroit entre `md` et `lg`.)* |
| Cohérence pages | **Même layout** pour `/connexion` et `/inscription` (composant shell partagé + contenu formulaire spécifique). |

---

## Colonne gauche (vidéo)

- **Comportement** : `<video>` en fond de colonne, `object-cover`, **muet**, **boucle**, `playsInline`, **`preload="metadata"`** ou `auto` selon perf.
- **Poster** : obligatoire (image de couverture avant lecture / si vidéo absente).
- **`prefers-reduced-motion: reduce`** : ne pas lancer la vidéo ; afficher **uniquement le poster** (ou image statique équivalente).
- **Accessibilité** : la vidéo est ** décorative** → `aria-hidden="true"` sur l’élément vidéo ; le **titre** de la page reste porté par la colonne droite (`<h1>` visible ou `sr-only` selon design typo, mais une cible h1 par route).
- **Repli** : si pas de fichier vidéo encore : fond **`bg-surface-muted`** (ou dégradé très léger aligné tokens Pessora), poster seul, **pas** de zone vide cassée.
- **Chemins** : fichier(s) sous `public/` (ex. `public/videos/auth-ambient.mp4` + poster `public/videos/auth-ambient-poster.jpg`) — noms exacts à figer en implémentation ; pas de URL externe obligatoire v1.

---

## Colonne droite (auth)

- **Conteneur** : `flex` colonne, **`justify-center`**, padding horizontal généreux (`px-4` → `md:px-10` → `lg:px-14`), largeur max du bloc formulaire **`max-w-md`** à l’intérieur de la demi-page.
- **Haut** : lien **logo** ou **« Retour au site »** vers `/` (cohérent avec l’existant).
- **Contenu** : titre display, sous-titre type `text-editorial-product-meta`, champs, erreurs, CTA noir pill (même langage que l’actuel), lien croisé inscription ↔ connexion.
- **Fond** : **`bg-white`** pour la colonne droite (contraste et continuité avec le tunnel d’inscription actuel).

---

## Composants (cible implémentation)

1. **`AuthSplitLayout`** (nom indicatif)  
   - Props : chemins `videoSrc`, `videoSrcWebm?`, `posterSrc`, enfants `children` = formulaire.  
   - Gère grille responsive, colonne vidéo, colonne droite, reduced motion.

2. **`Login`** / **`Register`**  
   - Enveloppés par `AuthSplitLayout` ; logique métier (`useAuth`, navigation) inchangée sauf ajustements mineurs.

---

## Accessibilité & formulaires (même chantier recommandé)

- **Labels visibles** pour chaque champ (au minimum une ligne au-dessus ou à côté), en complément des placeholders — alignement **WCAG** / règles projet (ne pas se fier au placeholder seul).
- **Focus** : anneau visible cohérent avec le reste du site (`focus-visible:ring` noir doux).
- **Ordre de tabulation** : retour accueil → champs → CTA → liens secondaires.

---

## Hors périmètre (v1 layout)

- Mot de passe oublié, OAuth social, double opt-in email : non requis pour livrer le **layout** ; peuvent être des routes ou liens « plus tard » sans bloquer le shell.
- **Header complet** du site marketing sur ces routes : **non** (tunnel auth dédié, comme aujourd’hui) — évite la double navigation ; le retour passe par logo / lien explicite.

---

## Critères d’acceptation

1. À partir de **`lg`**, deux colonnes visibles ; vidéo à gauche, formulaire à droite.  
2. En dessous de **`lg`**, une colonne : **vidéo d’abord**, **formulaire ensuite**.  
3. Aucun scroll horizontal sur viewports courants ; pas de chevauchement texte / vidéo.  
4. Avec **`prefers-reduced-motion`**, pas de lecture vidéo automatique ; poster visible.  
5. Login et Register partagent le **même shell** ; différenciation uniquement par le contenu formulaire.

---

## Self-review (spec)

- Pas de contradiction : mobile option 1 + split `lg` est cohérent.  
- Périmètre clair : layout + shell partagé ; champs Zod/RHF peuvent être une **phase suivante** si on veut découpler.  
- Chemins médias : noms exemples ; à remplacer par les fichiers réels du client lors de l’implémentation.
