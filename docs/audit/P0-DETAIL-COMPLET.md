# PESSORA — FIXES P0 (14 critiques) — Détail complet

---

## 🔴 STRIPE P0-1 : RLS leak — Commandes lisibles publiquement 🚨

**Fichier** : `supabase/migrations/20260531220000_guest_checkout_fields.sql` L15-17
**Gravité** : CRITIQUE — fuite de données personnelles

**Problème** : La policy RLS vérifie seulement `access_token IS NOT NULL` au lieu de matcher le token réel. N'importe qui avec la clé anon peut lire TOUTES les commandes.

```sql
-- ❌ AVANT : Policy cassée
CREATE POLICY "Anyone can read order by access_token" ON orders
  FOR SELECT USING (access_token IS NOT NULL);
```

```sql
-- ✅ APRÈS : Supprimer cette policy. Remplacer par une Edge Function
-- Ou si on garde RLS :
CREATE POLICY "Read order by matching access_token" ON orders
  FOR SELECT USING (
    access_token = current_setting('request.headers')::json->>'x-access-token'
  );
```

---

## 🔴 STRIPE P0-2 : access_token dans l'URL Stripe 🚨

**Fichier** : `supabase/functions/create-checkout-session/index.ts` L255
**Gravité** : CRITIQUE — token dans historique navigateur, logs, Referer

**Problème** : `success_url` contient le token → visible partout.

```ts
// ❌ AVANT
success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}&token=${accessToken}`
```

```ts
// ✅ APRÈS : Token retiré de l'URL. Récupéré côté serveur via session_id
success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`
// Dans CommandeSucces.tsx : appeler une Edge Function avec session_id
// qui retourne la commande (le access_token est dans orders.access_token)
```

---

## 🔴 STRIPE P0-3 : Usurpation email subscription 🚨

**Fichier** : `supabase/functions/create-subscription-session/index.ts` L10, 95
**Gravité** : CRITIQUE

**Problème** : Le champ `email` vient du body client → un user peut lier à un autre email.

```ts
// ❌ AVANT : email du body client
const { email } = body; // z.string().email().optional()
// ...
customer_email: email || user.email,
```

```ts
// ✅ APRÈS : email forcé depuis le JWT
// Supprimer le champ email du body Zod
// Toujours utiliser user.email
customer_email: user.email,
```

---

## 🔴 FRONTEND P0-01 : PickupTimePicker — créneaux périmés

**Fichier** : `src/components/cart/PickupTimePicker.tsx` L44, 66
**Gravité** : Bloquant UX — l'utilisateur peut sélectionner un créneau déjà passé

**Problème** : `useMemo([businessHours])` ne se réévalue jamais avec le temps.

```tsx
// ❌ AVANT : useMemo ne dépend pas du temps
const slots = useMemo(() => {
  const now = new Date(); // appelé une seule fois au montage
  // ...
}, [businessHours]);
```

```tsx
// ✅ APRÈS : Recalcul périodique
const [now, setNow] = useState(new Date());
useEffect(() => {
  const interval = setInterval(() => setNow(new Date()), 60000);
  return () => clearInterval(interval);
}, []);

const slots = useMemo(() => {
  // utilise now (state) qui se met à jour toutes les 60s
  // ...
}, [businessHours, now]);
```

---

## 🔴 FRONTEND P0-02 : DrinkOptionsModal — bouton "Ajouté" invisible

**Fichier** : `src/components/cart/DrinkOptionsModal.tsx` L267-274
**Gravité** : Bloquant UX — texte vert sur fond vert

```tsx
// ❌ AVANT : text-sapin sur bg-sapin = invisible
<Check className="h-4 w-4 text-sapin" strokeWidth={2} />
<span className="text-sapin">Ajouté</span>
```

```tsx
// ✅ APRÈS : texte blanc sur fond sapin
<Check className="h-4 w-4 text-white" strokeWidth={2} />
<span className="text-white">Ajouté</span>
```

---

## 🔴 FRONTEND P0-03 : OrderDetail — statuts en anglais brut

**Fichier** : `src/pages/member/OrderDetail.tsx` L8-12
**Gravité** : Bloquant UX — l'utilisateur voit "paid", "preparing", "ready"

```ts
// ❌ AVANT : manque paid, preparing, ready
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
```

```ts
// ✅ APRÈS
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
```

---

## 🔴 FRONTEND P0-04 : CartDrawer — pickupTime non réinitialisé

**Fichier** : `src/components/cart/CartDrawer.tsx` L28, 249-256
**Gravité** : Bloquant UX — ancien créneau pré-sélectionné après vidage panier

```tsx
// ❌ AVANT : clearCart sans reset pickupTime
const handleClearCart = () => {
  clearCart();
  // pickupTime garde sa valeur !
};
```

```tsx
// ✅ APRÈS
const handleClearCart = () => {
  clearCart();
  setPickupTime(''); // ← AJOUTER CETTE LIGNE
};
```

---

## 🔴 ADMIN P0-1 : Clé ANON pour mutations admin

**Fichier** : `src/lib/supabaseClient.ts` L15
**Gravité** : Critique — sécurité admin repose entièrement sur RLS

**Problème** : Si UNE politique RLS est mal configurée, bypass admin.

**À faire** (pas de code à modifier, mais audit RLS) :
1. Vérifier `is_admin()` dans CHAQUE policy de mutation pour :
   - `gamme_products` (INSERT, UPDATE, DELETE)
   - `bilan_slots` (INSERT, UPDATE, DELETE)
   - `bilan_bookings` (INSERT, UPDATE, DELETE)
   - `home_carousel_cards` (INSERT, UPDATE, DELETE)
   - `split_gammes` (INSERT, UPDATE, DELETE)
   - `bar_settings` (INSERT, UPDATE, DELETE)
   - `home_banner` (INSERT, UPDATE, DELETE)

Dans Supabase Dashboard → Authentication → Policies → vérifier chaque table.

---

## 🔴 ADMIN P0-2 : Validation upload images triviale

**Fichier** : `src/lib/storageUpload.ts` L1-31
**Gravité** : Critique — un attaquant peut uploader un fichier non-image

```ts
// ❌ AVANT : vérifie seulement file.type (spoofable)
export async function uploadPublicImage(file: File, bucket: string, pathPrefix: string) {
  if (!file.type.startsWith('image/')) throw new Error('Type non supporté');
  if (file.size > 5 * 1024 * 1024) throw new Error('Fichier trop volumineux');
  // ...
}
```

```ts
// ✅ APRÈS : vérification magic bytes
function isValidImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target!.result as ArrayBuffer);
      // Vérifier signatures : PNG=89504E47, JPEG=FFD8FF, WebP=52494646, GIF=47494638
      const isPNG = arr[0]===0x89 && arr[1]===0x50 && arr[2]===0x4E && arr[3]===0x47;
      const isJPEG = arr[0]===0xFF && arr[1]===0xD8 && arr[2]===0xFF;
      const isWebP = arr[0]===0x52 && arr[1]===0x49 && arr[2]===0x46 && arr[3]===0x46;
      const isGIF = arr[0]===0x47 && arr[1]===0x49 && arr[2]===0x46 && arr[3]===0x38;
      resolve(isPNG || isJPEG || isWebP || isGIF);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}
// Ajouter : if (!(await isValidImage(file))) throw new Error('Fichier non-image');
```

---

## 🔴 ADMIN P0-3 : CSRF implémenté mais jamais utilisé

**Fichier** : `src/lib/csrf.ts` L1-35
**Gravité** : Critique — code mort, fausse sécurité

**À faire** : Soit supprimer `src/lib/csrf.ts` (code mort), soit l'utiliser effectivement dans les Edge Functions.

Recommandation : supprimer. Le SDK Supabase gère déjà l'auth via JWT.

---

## 🔴 ADMIN P0-4 : Race condition statuts commandes

**Fichier** : `src/pages/admin/AdminOverview.tsx` L163-175
**Gravité** : Critique — deux admins peuvent modifier la même commande

```tsx
// ❌ AVANT : update optimiste sans vérification
const handleOrderAction = async (orderId: string, newStatus: string) => {
  setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus} : o));
  await supabase.from('orders').update({status: newStatus}).eq('id', orderId);
};
```

```tsx
// ✅ APRÈS : avec gestion d'erreur et rollback
const handleOrderAction = async (orderId: string, newStatus: string) => {
  const previousOrders = [...orders];
  setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus} : o));
  const { error } = await supabase.from('orders').update({status: newStatus}).eq('id', orderId);
  if (error) {
    setOrders(previousOrders); // rollback
    toast.error('Erreur lors de la mise à jour');
  }
};
```

---

## 🔴 SEO P0-1 : Téléphone masqué JSON-LD

**Fichier** : `index.html` L65
**Gravité** : Google ne peut pas afficher le rich snippet LocalBusiness

```html
<!-- ❌ AVANT -->
"telephone": "+596****0404"
```

```html
<!-- ✅ APRÈS : numéro réel format E.164 -->
"telephone": "+596696000404"
```

---

## 🔴 SEO P0-2 : Images OG relatives

**Fichier** : `index.html` L26, L35
**Gravité** : Crawlers ne résolvent pas les chemins relatifs

```html
<!-- ❌ AVANT -->
<meta property="og:image" content="/logo-pessora.png">
<meta name="twitter:image" content="/logo-pessora.png">
```

```html
<!-- ✅ APRÈS : URL absolue -->
<meta property="og:image" content="https://pessora.mq/logo-pessora.png">
<meta name="twitter:image" content="https://pessora.mq/logo-pessora.png">
```

---

## 🔴 SEO P0-3 : Titres en conflit avec seoConfig

**Fichiers** : `Home.tsx:55`, `Menu.tsx:70`, `Evenements.tsx:215`, `Contact.tsx:16`
**Gravité** : PageSEO est contourné → titles incohérents

```tsx
// ❌ AVANT : document.title écrase seoConfig
useEffect(() => {
  document.title = 'PessÓra — Bar Protéiné & Bien-Être, Martinique';
}, []);
```

```tsx
// ✅ APRÈS : Supprimer ces useEffect. PageSEO gère déjà tout.
// Si besoin de personnaliser : modifier seoConfig.ts
// Les 4 pages à corriger : Home.tsx, Menu.tsx, Evenements.tsx, Contact.tsx
// → Supprimer le bloc useEffect contenant document.title
```

---

## Ordre de priorité recommandé

1. **STRIPE P0-1** (RLS leak) — le plus urgent, fuite de données
2. **STRIPE P0-2** (token URL) — sécurité immédiate
3. **STRIPE P0-3** (usurpation email) — sécurité
4. **FRONTEND P0-01 → P0-04** — UX utilisateur
5. **SEO P0-1 → P0-3** — indexation Google
6. **ADMIN P0-1 → P0-4** — sécurité admin
