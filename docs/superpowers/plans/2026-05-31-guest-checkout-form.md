# Guest Checkout — Formulaire Nom & Téléphone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add name and phone fields to CartDrawer for guest checkout, required before Stripe payment.

**Architecture:** Two-file change — `useCheckout` gains `clientName`/`clientPhone` params forwarded to Edge Function; `CartDrawer` gains auth-gated form fields with validation, wired to the updated hook.

**Tech Stack:** React 19, TypeScript, HeroUI (Button, Input), Supabase Auth

---

### Task 1: Update `useCheckout` to accept and forward guest info

**Files:**
- Modify: `src/hooks/useCheckout.ts`

- [ ] **Step 1: Add `clientName` and `clientPhone` parameters to the hook signature**

Change line 5:
```ts
// Before
export function useCheckout(pickupTime: string) {

// After
export function useCheckout(pickupTime: string, clientName: string, clientPhone: string) {
```

- [ ] **Step 2: Include `client_name` and `client_phone` in the Edge Function body**

Change line 20:
```ts
// Before
{ body: { items, user_id: userId, pickup_time: pickupTime || null } },

// After
{ body: { items, user_id: userId, pickup_time: pickupTime || null, client_name: clientName || null, client_phone: clientPhone || null } },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors related to useCheckout.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCheckout.ts
git commit -m "feat(useCheckout): accept clientName + clientPhone for guest checkout"
```

---

### Task 2: Add guest name/phone inputs to `CartDrawer`

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`

- [ ] **Step 1: Import `useAuth`**

Add after the `useBarStatus` import (line 15):
```ts
import { useAuth } from '../../contexts/AuthContext';
```

- [ ] **Step 2: Add guest state and auth check**

After the existing hooks (after `const barStatus = useBarStatus();` on line 31), add:
```ts
const { isAuthenticated } = useAuth();
const [guestName, setGuestName] = useState('');
const [guestPhone, setGuestPhone] = useState('');
```

- [ ] **Step 3: Wire guest info to `useCheckout`**

Change line 30:
```ts
// Before
const { checkout, isLoading: isCheckingOut, error: checkoutError } = useCheckout(pickupTime);

// After
const { checkout, isLoading: isCheckingOut, error: checkoutError } = useCheckout(pickupTime, guestName, guestPhone);
```

- [ ] **Step 4: Compute validation state**

After `const hasStripe = items.length > 0;` (line 38), add:
```ts
const isGuest = !isAuthenticated;
const guestNameValid = guestName.trim().length >= 2;
const guestPhoneValid = /^0[1-9]\d{8}$/.test(guestPhone.trim());
const guestFormValid = !isGuest || (guestNameValid && guestPhoneValid);
```

- [ ] **Step 5: Add guest form fields in the footer**

Insert between the `PickupTimePicker` closing `</>` (line 199) and before the first child of `Sheet.Footer` (the Total div at line 200), add:
```tsx
{isGuest && (
  <div className="flex flex-col gap-3 pb-4">
    <input
      type="text"
      placeholder="Votre nom"
      value={guestName}
      onChange={(e) => setGuestName(e.target.value)}
      className="h-11 min-h-[44px] w-full rounded-full border border-noir/[0.12] bg-white px-5 text-[12px] text-black placeholder:text-black/30 outline-none focus:border-noir/30"
    />
    <input
      type="tel"
      placeholder="06 XX XX XX XX"
      value={guestPhone}
      onChange={(e) => setGuestPhone(e.target.value)}
      className="h-11 min-h-[44px] w-full rounded-full border border-noir/[0.12] bg-white px-5 text-[12px] text-black placeholder:text-black/30 outline-none focus:border-noir/30"
    />
    {guestName && !guestNameValid && (
      <p className="text-[9px] text-red-400">2 caractères minimum</p>
    )}
    {guestPhone && !guestPhoneValid && (
      <p className="text-[9px] text-red-400">Format : 06 XX XX XX XX</p>
    )}
  </div>
)}
```

- [ ] **Step 6: Disable the Pay button when guest form is invalid**

Change the `isDisabled` prop on the Payer button (line 228):
```tsx
// Before
isDisabled={isCheckingOut}

// After
isDisabled={isCheckingOut || !guestFormValid}
```

- [ ] **Step 7: Clear guest fields when cart is emptied**

Update the `clearCart` handler (line 253) to also reset guest state. Change:
```tsx
onClick={() => clearCart()}
```
to:
```tsx
onClick={() => { clearCart(); setGuestName(''); setGuestPhone(''); }}
```

- [ ] **Step 8: Type-check and build**

Run:
```bash
npx tsc --noEmit
npm run build 2>&1 | grep "✓ built"
```
Expected: No TypeScript errors. Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/cart/CartDrawer.tsx
git commit -m "feat(CartDrawer): guest checkout form — name + phone fields before payment"
```
