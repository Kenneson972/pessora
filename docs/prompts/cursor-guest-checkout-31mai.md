# Cursor Prompt — Commandes Invité Pessora (31 Mai 2026)

## Contexte

Pessora est un bar physique à Fort-de-France. Le client type arrive, scanne un QR code, commande son shake, paie, et attend au comptoir. Lui imposer de créer un compte pour commander est un **tueur de conversion** — Dal Cielo le permet, tout le secteur le fait.

Actuellement `useCheckout` redirige vers `/connexion?next=panier` si pas de session. On change ça.

---

## Spécifications

### Principe

- Le panier (`cartStore`) reste inchangé
- Au moment de payer, si l'utilisateur n'est pas connecté → on crée une commande **sans user_id**, avec un token public pour le suivi
- L'Edge Function `create-checkout-session` accepte un mode invité

---

### Étape 1 : Modifier `useCheckout` — accepter le mode invité

**Fichier :** `src/hooks/useCheckout.ts`

```tsx
// AVANT
if (!session) {
  navigate('/connexion?next=panier');
  return;
}

// APRÈS
const userId = session?.user?.id ?? null;
// Si pas de session ET que le mode invité est désactivé → connexion
// Sinon, on passe user_id: null et on gère en Edge Function
```

Le booléen `guestMode` pourrait être défini via une variable d'env `VITE_ALLOW_GUEST_CHECKOUT` pour pouvoir l'activer/désactiver sans redeploy.

**En pratique, le plus simple :**

```tsx
// Remplacer le bloc if (!session) par :
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id ?? null;
// Mode invité : on passe user_id=null si pas connecté
// (le backend gère le cas sans user_id)

const { data, error: fnError } = await supabase.functions.invoke(
  'create-checkout-session',
  { body: { items, user_id: userId, pickup_time: pickupTime || null } },
);
```

### Étape 2 : Modifier le Zod schema + la logique Edge Function

**Fichier :** `supabase/functions/create-checkout-session/index.ts`

```tsx
// Zod : rendre user_id nullable
const CheckoutRequestSchema = z.object({
  items: z.array(CartLineSchema).min(1),
  user_id: z.string().uuid().nullable().optional(),  // ← nullable
  pickup_time: z.string().nullable().optional(),
});
```

```tsx
// Supprimer la vérification user_id === user.id 
// (ou la rendre conditionnelle : seulement si user_id est fourni)
const { items, user_id, pickup_time } = parsed.data;

// Si authentifié, vérifier que le token match
if (user_id) {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), { ... });
  }
  if (user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'user_id ne correspond pas' }), { ... });
  }
}
// Si user_id est null → commande invité, pas de vérification JWT
```

Puis dans l'insertion de la commande :
```tsx
const orderPayload: any = { total, status: 'pending', pickup_time: orderPickupTime };
if (user_id) orderPayload.user_id = user_id; // null → pas de user_id

const { data: order } = await supabase
  .from('orders')
  .insert(orderPayload)
  .select('id')
  .single();
```

### Étape 3 : Adapter la page succès

**Fichier :** `src/pages/CommandeSucces.tsx`

- Si commande invité → générer un lien de suivi unique avec le `order_id` dans l'URL
- Actuellement la page utilise `session_id` Stripe. Ajouter un fallback : si pas de session, afficher "Commande confirmée — votre numéro : #XXXXX"
- Ajouter un lien `/suivi-commande` (ou adapter `OrderDetail` pour accepter un accès par `order_id` + email)

### Étape 4 : Adapter les RLS orders

**Fichier :** une nouvelle migration `20260531160000_allow_guest_orders.sql`

```sql
-- Permettre l'INSERT de commandes sans user_id
DROP POLICY IF EXISTS "Allow guest order insert" ON public.orders;
CREATE POLICY "Allow guest order insert" ON public.orders
  FOR INSERT
  WITH CHECK (true);  -- ou WITH CHECK (auth.role() = 'anon' OR auth.uid() IS NOT NULL)

-- Un utilisateur non-authentifié peut voir sa commande via un token/lien
-- (optionnel — si on veut un suivi public)
```

---

## Checklist

- [ ] `useCheckout.ts` : user_id nullable, pas de redirection forcée
- [ ] `create-checkout-session/index.ts` : accepter user_id null
- [ ] `CommandeSucces.tsx` : affichage adapté mode invité
- [ ] RLS : permettre INSERT sans user_id (ou via Edge Function qui bypass avec service key)
- [ ] Tester : paiement sans compte → Stripe → succès → lien suivi
- [ ] Ajouter `VITE_ALLOW_GUEST_CHECKOUT=true` dans `.env` (optionnel, toggle)
