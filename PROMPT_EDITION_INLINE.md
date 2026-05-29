# Prompt Cursor — Édition inline des fiches produits depuis les pages publiques

## Objectif
Quand un admin est connecté, les pages produit publiques (/nos-produits/:rangeId/:slug et /menu/:slug) doivent afficher un bouton "✏️ Modifier" qui passe la fiche en mode édition inline.

---

## TÂCHE 1 — Pages boissons (/menu/:slug) → Fichier : src/pages/DrinkDetail.tsx

1. **Détecter si admin** : importer `useAuth` depuis `../../contexts/AuthContext`, récupérer `user`, vérifier `user?.role === 'admin'`
2. **Ajouter un bouton "✏️ Modifier"** en haut à droite de la page, visible uniquement si admin
3. **Mode édition** : au clic, remplacer les affichages texte par des inputs/textarea pré-remplis :
   - Nom, description, prix, calories, protéines, emoji, tags
   - Upload image (réutiliser le composant d'upload de AdminProductEditorForm si possible, sinon un simple <input type="file">)
4. **Bouton "💾 Enregistrer"** : appelle `supabase.from('products').update(payload).eq('slug', slug)` puis `invalidateMenuCatalogCache()`
5. **Bouton "Annuler"** : revient au mode lecture

---

## TÂCHE 2 — Pages gammes (/nos-produits/:rangeId/:slug) → Fichier : src/pages/GammeProductDetail.tsx

Même chose pour les produits gamme (sport/skin/wellness) :
1. Détecter admin via `useAuth`
2. Bouton "✏️ Modifier"
3. Mode édition inline : nom, description, prix, prix_alt, image, ordre
4. Appel Supabase : `.from('gamme_products').update(payload).eq('slug', slug)`
5. Annuler

---

## Contraintes
- Réutiliser les composants HeroUI déjà en place (Input, Textarea, Button)
- L'upload image doit utiliser `uploadPublicImage` depuis `../../lib/uploadImage` si possible
- Ajouter `invalidateMenuCatalogCache()` après chaque sauvegarde
- Le mode édition ne doit PAS casser l'affichage pour les visiteurs non-admin
- Style cohérent avec le design existant (noir/ivoire/or, polices)
