# Cursor Prompt — Fix Stripe Pricing : Sizes + Boosters

## Contexte

Le flux Stripe a une **faille de sous-facturation** sur les boissons personnalisées.
Le front calcule correctement le prix (taille + boosters), mais le serveur l'ignore
et facture uniquement le prix de base `products.price`.

---

## Problème #1 (CRITIQUE) : `fetchVerifiedPrice` ignore les tailles et les boosters

**Fichier :** `supabase/functions/create-checkout-session/index.ts`
**Fonction :** `fetchVerifiedPrice` (lignes ~35-75)

### Ce qui se passe :

1. Le client choisit une taille (small/medium/large) → `unitPrice` = prix de cette taille
2. Le client ajoute des boosters → `unitPrice` += 1€ par booster
3. Le client envoie au serveur : `{ unitPrice: 14, optionsKey: "milk:avoine|boost:collagene,creatine", ... }`
4. Le serveur appelle `fetchVerifiedPrice` qui fait :
   ```ts
   // Seulement ça :
   const { data } = await supabase.from('products').select('slug, price').eq('slug', item.productId).single()
   return { verifiedUnitPrice: Number(data.price) } // ← price uniquement, ignore TOUT le reste
   ```
5. **Résultat :** Stripe facture 10€ au lieu de 14€. Le client est sous-facturé.

### Données manquantes côté serveur :

1. **Taille** : `optionsKey` ne contient PAS la taille actuellement. Le front passe `size` à `buildDrinkCartOptions` mais elle n'est pas encodée dans `optionsKey`.
2. **Boosters** : `optionsKey` contient `boost:collagene,creatine` mais le serveur ne le parse jamais.
3. **`barBasePublic`** : le cartStore stocke ce champ, mais le Zod schema serveur (`CartLineSchema`) ne l'inclut pas → il est silently stripped.

### Ce qu'il faut faire :

#### Étape 1 : Encoder la taille dans `optionsKey`

**Fichier :** `src/lib/cartLine.ts`

Dans `buildDrinkCartOptions`, ajouter la taille au `optionsKey` :
```ts
// AVANT
optionsKey = [milkPart, `boost:${sortedBoost.join(',')}`].filter(Boolean).join('|');

// APRÈS (ajouter le segment size si une taille est fournie)
const sizePart = size ? `size:${size}` : null;
optionsKey = [sizePart, milkPart, `boost:${sortedBoost.join(',')}`].filter(Boolean).join('|');
```

Exemple : `"size:large|milk:avoine|boost:collagene,creatine"`

#### Étape 2 : Ajouter `barBasePublic` au Zod schema serveur

**Fichier :** `supabase/functions/create-checkout-session/index.ts`

Dans `CartLineSchema`, ajouter :
```ts
barBasePublic: z.number().positive().optional(),
```

Ça permet au serveur de recevoir le prix de base (taille seule, sans boosters) pour
contre-vérification.

#### Étape 3 : Corriger `fetchVerifiedPrice` pour gérer tailles + boosters

**Fichier :** `supabase/functions/create-checkout-session/index.ts`

Remplacer la logique bar par :

```ts
// Pour les produits bar : lire la bonne colonne de prix selon la taille
// Extraire la taille depuis optionsKey
const sizeFromKey = item.optionsKey?.match(/(?:^|\|)size:(small|medium|large)(?:\||$)/)?.[1] ?? null;

// Extraire le nombre de boosters depuis optionsKey
const boostMatch = item.optionsKey?.match(/(?:^|\|)boost:([^|]*)/);
const boosterCount = boostMatch?.[1] ? boostMatch[1].split(',').filter(Boolean).length : 0;

// Colonne de prix selon la taille (fallback → price par défaut)
const priceCol = sizeFromKey === 'small' ? 'price_small'
  : sizeFromKey === 'large' ? 'price_large'
  : 'price'; // medium = colonne price par défaut

const { data, error } = await supabase
  .from('products')
  .select(`slug, price, ${priceCol}`)
  .eq('active', true)
  .eq(UUID_RE.test(item.productId) ? 'id' : 'slug', item.productId)
  .single();

if (error || !data) {
  throw new Error(`Produit bar introuvable : ${item.productId}`);
}

// Prix de base = colonne taille spécifique (si dispo), sinon colonne price
const baseProductPrice = Number(data[priceCol] ?? data.price);

// Vérification anti-fraude : écarter le unitPrice client s'il diffère trop
// (tolérance de 0.01€ pour les arrondis)
const clientBaseEstimate = item.barBasePublic ?? (item.unitPrice - boosterCount);
if (Math.abs(clientBaseEstimate - baseProductPrice) > 0.02) {
  throw new Error(
    `Écart prix suspect : client=${clientBaseEstimate}€, serveur=${baseProductPrice}€ pour ${item.productId}`
  );
}

const verifiedUnitPrice = baseProductPrice + boosterCount;
return { verifiedUnitPrice, productId: null };
```

#### Étape 4 : Tests manuels à faire après le fix

- Commander une boisson taille **Large** + 2 boosters → vérifier que Stripe facture le bon prix
- Commander une boisson taille **Small** sans booster → vérifier
- Commander une boisson sans tailles (catégorie wellness/coffee) → vérifier que ça tombe sur `price`
- Vérifier que l'admin voit le bon `total` et `price_at_time` dans order_items

---

## Problème #2 (LOW) : Webhook ne gère pas les paiements asynchrones

**Fichier :** `supabase/functions/stripe-webhook/index.ts`

Le webhook écoute `checkout.session.completed` mais pas :
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Si un client paie par virement/SEPA, le paiement peut arriver en différé.

**Fix suggéré :** Ajouter ces 2 cas dans le switch, avec la même logique que `checkout.session.completed`
(ou a minima logger pour suivre).

---

## Problème #3 (LOW) : Rate limiting manquant sur subscription

**Fichier :** `supabase/functions/create-subscription-session/index.ts`

Pas de `checkRateLimit` comme dans `create-checkout-session`. Ajouter pour parité.

---

## Checklist

- [ ] `cartLine.ts` : ajouter `size` dans optionsKey
- [ ] `CartLineSchema` : ajouter `barBasePublic`
- [ ] `fetchVerifiedPrice` : lire la bonne colonne prix + ajouter boosters
- [ ] `stripe-webhook` : gérer `async_payment_succeeded/failed`
- [ ] `create-subscription-session` : ajouter rate limiting
- [ ] Test manuel : commande boisson large + boosters
