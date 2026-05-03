# Dashboard — Remplacer "Commander à nouveau" par l'historique

## Objectif

Remplacer la section "Commander à nouveau" (grille de 8 produits catalogue) dans le Dashboard de l'espace client par un **vrai historique des dernières commandes** avec lien pour recommander.

## Données

- `useOrders()` fournit déjà `orders: OrderWithItems[]` trié par `created_at DESC`, avec `order_items` (product_name, quantity, price_at_time).
- On garde le fetch dans le hook existant — pas de nouvelle requête.
- On prend les **3 dernières commandes** maximum.

## Design visuel

```
┌─ DashCard ─────────────────────────────────────────────┐
│  Mes dernières commandes              Toute l'histoire › │
│                                                         │
│  12 mai · 2× Boost, 1× Détox             24,00€   ↩    │
│  03 mai · 1× Wave                         8,50€    ↩    │
│  28 avr · 3× Fusion                      36,00€    ↩    │
│                                                         │
│  ↳ Voir le catalogue pour commander                    │
└─────────────────────────────────────────────────────────┘
```

- En-tête : "Mes dernières commandes" + lien "Toute l'histoire" vers `/mon-espace/historique`
- Chaque ligne : date + noms produits + montant + lien ↩ pour recommander (→ `/menu`)
- Dernière ligne : lien discret vers le catalogue (si pas de commande récente)
- État vide si aucune commande : message + CTA "Parcourir le catalogue"

## Implémentation

1. **Dashboard.tsx** (lignes 352-406) :
   - Supprimer le `useEffect` qui fetch les `products`
   - Supprimer l'import `useEffect` si plus utilisé
   - Supprimer l'état `products`, le type import `Product`, la fonction `formatProductMeta`
   - Remplacer la section "Reorder strip" par la section "Mes dernières commandes"
   - Utiliser `orders.slice(0, 3)` pour les 3 dernières
   - Chaque ligne : `<Link to={/menu}>` avec icône de ré-commande
   - Style cohérent avec la section "Agenda à venir" (bordures, espacements, typo)

2. **Aucun changement** dans `useOrders` ou les types.

## Fichiers modifiés

- `src/pages/member/Dashboard.tsx` uniquement.
