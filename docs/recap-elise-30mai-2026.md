# Récap Élise — Mise à jour 31 Mai 2026 (soir)

## Résumé rapide

- **28/36** produits gamme ont leur image (Herbalife CDN + autres sources)
- **100%** des produits ont des **descriptions enrichies** (2-3 phrases marketing)
- **15 produits Skin** dans la base (était 7), tous avec descriptions et images
- **6 produits Wellness** avec descriptions enrichies
- **15 produits Sport** avec descriptions enrichies
- Panier : corrigé (l'URL s'affichait en texte au lieu de l'image)
- Carrousel homepage : affiche les vraies images DB + liens détail

---

## Reste 8 produits sans image

| Gamme | Produit | SKU recherché |
|-------|---------|---------------|
| Sport | Barre Sport x6 | ? |
| Sport | Chips BBQ Onions x10 | ? |
| Sport | Barre Céréales x7 | ? |
| Sport | Barres Collations x14 | ? |
| Sport | Electrolytes Sachet x10 | même visuel que CR7 Boîte ? |
| Skin | Crème Hydrant Éclat | ? |
| Skin | Crème Hydrant Yeux | ? |
| Skin | Exfoliant (corps) | ? |
| Skin | Crème Hydratante FPS 30 | ? |
| Skin | Sérum Rides | ? |

---

## Images trouvées depuis la dernière fois

4 nouveaux SKU confirmés par Élise (commit `38077fc`) :
- **Collagène** → `pc-076k-fr.png`
- **Omega 3** → vercorssportsteam.com (image externe)
- **Hydrate** → `pc-3150-fr.png`
- **Lotion Tonique** → cdn.webshopapp.com

+ 8 produits Skin ajoutés avec images Herbalife : Gel Contour Yeux (2561), Crème de Nuit (539k), Sérum Niacinamide (508k), Masque d'Argile (0773), Lotion Nourrissante (514k), etc.

---

## Descriptions enrichies

Tous les 36 produits ont maintenant des descriptions marketing 2-3 phrases (Herbalife officiel ou adapté). Les 7 descriptions courtes d'une ligne sur la gamme Skin ont été remplacées aujourd'hui.

---

## Pattern des URLs Herbalife

```
https://www.herbalife.com/dmassets/market-reusable-assets/emea/france/images/canister/pc-XXXX-fr.png
```

---

## Prochaines étapes

1. Élise confirme les 8-10 SKU manquants → je mets à jour DB + static en 2 minutes
2. Les images chargent depuis le CDN Herbalife (pas d'upload nécessaire)
3. Si vous voulez héberger les images vous-mêmes, on peut les mettre dans Supabase Storage
