# Audit Espace ADMIN : Pessora vs Dal Cielo

**Date** : 30 mai 2026  
**Référence** : Dal Cielo (pizzeria en ligne, Next.js App Router)  
**Cible** : Pessora (bar protéiné, Vite + React Router)  
**Stack commune** : Tailwind, Supabase, Recharts (Dal Cielo), Framer Motion

---

## 1. INVENTAIRE COMPLET

### 1.1 Dal Cielo — Pages & Composants Admin

**Page principale** (`/src/app/admin/page.tsx`, 1591 lignes) — SPA avec 10 vues :

| # | Vue | Composant | Rôle |
|---|-----|-----------|------|
| 1 | `dashboard` | — | KPIs, RevenueChart, TopPizzas, StockAlerts, QuickActions |
| 2 | `orders` | OrdersList, QuickActions | Gestion commandes (filtres, statuts, suppression) |
| 3 | `receipts` | ReceiptsManager | Reçus catégorisés (Comptabilité, Litige, etc.) |
| 4 | `stocks` | StocksManager, StockAlerts | CRUD stocks, seuils, alertes, seed |
| 5 | `kitchen` | KitchenMode | Mode cuisine plein écran, timer live par commande |
| 6 | `analytics` | RevenueChart | Revenus par créneau 15min (Recharts) |
| 7 | `menu` | MenuManager, ChefPizzaEditor | CRUD produits, pizza du chef, upload images |
| 8 | `announcement` | AnnouncementEditor | Popups avec preview (chef/promo/event/alert) |
| 9 | `reviews` | ReviewsManager | Modération avis (pending → approve/reject) |
| 10 | `clients` | ClientsManager | CRM : clients, fidélité, import/export, invitation |

**Composants admin** (18 fichiers) :
- `AdminSidebar.tsx` — Sidebar collapsible, badge compteur commandes
- `AdminToast.tsx` — Système toast animé (success/error/info)
- `AnnouncementEditor.tsx` — Éditeur popup avec aperçu live
- `ChefPizzaEditor.tsx` — Produit spécial du chef (images slider, date validité)
- `ClientsManager.tsx` — CRM complet (863 lignes)
- `KPICard.tsx` — Widget KPI
- `KitchenMode.tsx` — Mode cuisine timer (288 lignes)
- `MenuManager.tsx` — Gestion catalogue (1500 lignes)
- `OrdersList.tsx` — Liste commandes avec actions groupées
- `QuickActions.tsx` — Actions rapides : valider, refuser (motif), retarder, remise, WhatsApp
- `ReceiptsManager.tsx` — Gestion reçus (494 lignes)
- `RevenueChart.tsx` — Graphique Recharts revenus/temps (156 lignes)
- `ReviewsManager.tsx` — Modération avis (243 lignes)
- `StockAlerts.tsx` — Alertes stock temps réel (148 lignes)
- `StocksManager.tsx` — CRUD stocks
- `TopPizzas.tsx` — Top ventes du jour
- `ui/AdminCard.tsx`, `ui/AdminImageDropzone.tsx`, `ui/AdminSectionHeader.tsx`
- `adminUi.ts` — Design tokens partagés

**API Routes** (18 endpoints) :
- `/api/admin/me` — Vérification PIN
- `/api/admin/validate` — Validation admin
- `/api/admin/orders` + `[id]` + `export` + `cleanup`
- `/api/admin/products` + `[id]` + `seed`
- `/api/admin/stocks` + `[item_id]` + `seed`
- `/api/admin/reviews` + `[id]`
- `/api/admin/clients` + `[id]` + `export` + `import` + `sync-auth` + `invite` + `redeem-reward`
- `/api/admin/popups` + `[id]`
- `/api/admin/homepage-settings`
- `/api/admin/queue-settings`
- `/api/admin/upload`
- `/api/admin/badge-categories` + `[id]`
- `/api/admin/bot-notify`

**Librairies admin** :
- `adminAuth.ts` — Auth PIN + rate limiting
- `auditLog.ts` — Journal d'audit
- `csrf.ts` — Protection CSRF
- `stocksStore.ts`, `productsStore.ts`, `ordersStore.ts`, `reviewsStore.ts`, `popupsStore.ts` — Stores typés
- `whatsappTemplates.ts` — Templates WhatsApp
- `orderPricing.ts` — Calcul prix/remises

---

### 1.2 Pessora — Pages & Composants Admin

**Pages** (16 fichiers dans `/src/pages/admin/`) :

| Page | Rôle | Lignes |
|------|------|--------|
| `AdminLayout.tsx` | Layout avec sidebar + bottom nav mobile | 156 |
| `AdminOverview.tsx` | Dashboard : KPIs membres, MRR, événements, commandes, abonnements expirés | 584 |
| `AdminMembers.tsx` | Liste membres avec filtre par plan, CSV export | 326 |
| `AdminMemberDetail.tsx` | Détail membre individuel | ~200 |
| `AdminEvenements.tsx` | CRUD événements + inscriptions + popup sync + galerie | 740 |
| `AdminProduits.tsx` | CRUD produits, carousel management, archivage | 550 |
| `AdminGammes.tsx` | CRUD produits gamme (Sport/Skin/Wellness) | 606 |
| `AdminProduitsGammes.tsx` | Tabs produits + gammes | 53 |
| `AdminCommandes.tsx` | Gestion commandes, alertes sonores, filtres, KPIs | 140 |
| `AdminBilans.tsx` | Créneaux bilan + réservations, calendrier | 684 |
| `AdminCommunications.tsx` | Annonces/popups + abonnés newsletter | 546 |
| `AdminContenu.tsx` | Tabs contenu (infos bar, carrousel, moments, bannière) | 63 |
| `AdminInfosBar.tsx` | Éditeur infos bar | — |
| `AdminCarousel.tsx` | Gestion carrousel | — |
| `AdminHomeBanner.tsx` | Éditeur bannière homepage | 119 |
| `AdminSplitGammes.tsx` | Gestion des « moments » (gammes splittées) | — |

**Composants admin** (14 fichiers dans `/src/components/admin/`) :
- `AdminCarouselToggle.tsx`
- `AdminOrderCard.tsx`, `AdminOrdersFilter.tsx`, `AdminOrdersList.tsx`
- `AdminProductEditorForm.tsx`, `AdminProductForm.tsx`, `AdminProductGallery.tsx`
- `DrinkDetailAdminEdit.tsx`, `GammeProductDetailAdminEdit.tsx`
- `EventForm.tsx`, `EventGalleryManager.tsx`, `EventRegistrationsList.tsx`
- `ProductImageDropzone.tsx`
- `eventEditorTypes.ts`

**Composants dashboard** (5 fichiers) :
- `AdminErrorAlert.tsx`, `ConfirmDialog.tsx`, `DashboardBottomNav.tsx`
- `layoutClasses.ts`, `primitives.tsx` (DashCard, DashPageHeader, DashBtn, etc.)

**Hooks admin** (5) :
- `useAdminMembers.ts`, `useAdminOrders.ts`, `useAdminTable.ts`
- `useAdminEventRegistrations.ts`, `useOrders.ts`

**API Routes** : **AUCUNE** — Pessora appelle Supabase directement côté client.

---

## 2. TABLEAU COMPARATIF DÉTAILLÉ

| # | Feature | Dal Cielo | Pessora | Statut | Priorité |
|---|---------|-----------|---------|--------|----------|
| **🔐 Authentification & Sécurité** |
| 1 | Auth PIN + rate limiting | ✅ `adminAuth.ts` | ❌ (Supabase Auth) | 🟡 | — |
| 2 | Protection CSRF | ✅ `csrf.ts` + `x-csrf-token` | ❌ | 🟡 | 🟠 |
| 3 | API routes sécurisées serveur | ✅ 18 endpoints | ❌ (appels Supabase directs) | 🔴 | 🔴 |
| 4 | Audit log | ✅ `auditLog.ts` | ❌ | 🟡 | 🟡 |
| **📊 Dashboard & Analytics** |
| 5 | KPIs en temps réel | ✅ 6 KPIs | ✅ 6 KPIs (membres, MRR, etc.) | ✅ | — |
| 6 | Revenue chart (Recharts) | ✅ BarChart par créneau | ❌ | 🔴 | 🔴 |
| 7 | Top produits du jour | ✅ TopPizzas | ❌ | 🟡 | 🟡 |
| 8 | Taux de validation | ✅ | ❌ | 🟡 | 🟠 |
| 9 | Temps de préparation moyen | ✅ | ❌ | 🟡 | 🟠 |
| **📦 Commandes** |
| 10 | Gestion statuts complète | ✅ 9 statuts | 🟡 5 statuts (basique) | 🟡 | 🟠 |
| 11 | Actions rapides (remise, refus motivé, délai) | ✅ QuickActions | ❌ | 🔴 | 🟠 |
| 12 | Export CSV commandes | ✅ | ❌ | 🟡 | 🟠 |
| 13 | Alertes sonores nouvelles commandes | ✅ | ✅ | ✅ | — |
| 14 | Nettoyage auto commandes obsolètes | ✅ `/orders/cleanup` | ❌ | 🟡 | 🟠 |
| 15 | Mode cuisine/bar plein écran | ✅ KitchenMode + timer | ❌ | 🔴 | 🟠 |
| **🏪 Produits & Menu** |
| 16 | CRUD produits | ✅ MenuManager (1500L) | ✅ AdminProduits (550L) + Gammes | ✅ | — |
| 17 | Produit spécial vedette | ✅ ChefPizzaEditor | ❌ | 🟡 | 🟡 |
| 18 | Toggle dispo/populaire/végétarien | ✅ | ✅ (partiel) | ✅ | — |
| 19 | Upload images drag & drop | ✅ AdminImageDropzone | ✅ ProductImageDropzone | ✅ | — |
| 20 | Seed produits | ✅ `/products/seed` | ❌ | 🟡 | 🟡 |
| **📋 Stocks** |
| 21 | CRUD stocks avec seuils | ✅ StocksManager | ❌ | 🔴 | 🔴 |
| 22 | Alertes stock critiques | ✅ StockAlerts (auto-refresh 30s) | ❌ | 🔴 | 🔴 |
| 23 | Seed stocks | ✅ `/stocks/seed` | ❌ | 🟡 | 🟡 |
| **👥 Clients / Membres** |
| 24 | Gestion membres/clients | ✅ ClientsManager | ✅ AdminMembers | ✅ | — |
| 25 | Programme fidélité (points, rewards) | ✅ redeem-reward | ❌ | 🟡 | 🟠 |
| 26 | Import/Export CSV clients | ✅ import + export | ✅ export seulement | 🟡 | 🟡 |
| 27 | Invitation client (auth sync) | ✅ `/clients/[id]/invite` | ❌ | 🟡 | 🟡 |
| 28 | Abonnements & MRR | ❌ | ✅ (Óra+/Free) | ✅ | — |
| 29 | Bilan santé | ❌ | ✅ AdminBilans | ✅ | — |
| **📢 Communication** |
| 30 | Popups/Annonces | ✅ AnnouncementEditor + preview | ✅ AdminCommunications | ✅ | — |
| 31 | Notifications WhatsApp | ✅ whatsappTemplates + bot-notify | ❌ | 🟡 | 🟡 |
| 32 | Newsletter subscribers | ❌ | ✅ | ✅ | — |
| **⭐ Avis & Réseaux** |
| 33 | Modération avis clients | ✅ ReviewsManager (approve/reject) | ❌ | 🟡 | 🟡 |
| 34 | Page contenu (carrousel, bannière, infos) | ❌ | ✅ AdminContenu | ✅ | — |
| **🎨 UI/UX Admin** |
| 35 | Toast notifications | ✅ AdminToast (animé, 3 types) | ❌ | 🟡 | 🔴 |
| 36 | Sidebar collapsible | ✅ Toggle + persistence | ❌ (sidebar responsive fixe) | 🟡 | 🟡 |
| 37 | Bottom nav mobile | ❌ | ✅ DashboardBottomNav | ✅ | — |
| 38 | Confirm dialog | ❌ (intégré inline) | ✅ ConfirmDialog | ✅ | — |
| 39 | Design system partagé | ✅ adminUi.ts (tokens) | ✅ layoutClasses + primitives | ✅ | — |
| **📐 Architectures spécifiques Pessora** |
| 40 | Événements + inscriptions | ❌ | ✅ (très complet) | ✅ | — |
| 41 | Gammes (Sport/Skin/Wellness) | ❌ | ✅ | ✅ | — |
| 42 | Bilans santé | ❌ | ✅ | ✅ | — |
| 43 | Page contenu (infos bar, carrousel, banner) | ❌ | ✅ | ✅ | — |

---

## 3. PRIORISATION

### 🔴 CRITIQUE — Manque urgent (sécurité, opérations, data)

| # | Feature | Complexité | Adaptable Dal Cielo ? | Effort estimé |
|---|---------|------------|----------------------|---------------|
| **1. API Routes sécurisées** | Lourde | Non (archi différente : App Router vs Vite) | 3-5 jours |
| → Pessora appelle Supabase directement = pas de validation côté serveur, pas de rate limiting, pas d'audit. Créer des API endpoints avec validation JWT/PIN. | | | |
| **2. Gestion des stocks + alertes** | Moyenne | ✅ Oui (adapter StocksManager + StockAlerts) | 2-3 jours |
| → Un bar a des ingrédients périssables. Alertes critiques quand seuil bas, CRUD stocks. | | | |
| **3. Revenue Analytics / Charts** | Moyenne | ✅ Oui (adapter RevenueChart avec Recharts) | 1-2 jours |
| → Graphique CA par heure/jour, tendances, comparaison périodes. Indispensable pour piloter le bar. | | | |
| **4. Admin Toast System** | Facile | ✅ Oui (copier-coller quasi direct) | 0.5 jour |
| → Feedback utilisateur immédiat. Dal Cielo a un système élégant prêt à l'emploi. | | | |

### 🟠 IMPORTANT — Fort impact, pas bloquant

| # | Feature | Complexité | Adaptable Dal Cielo ? | Effort estimé |
|---|---------|------------|----------------------|---------------|
| **5. Mode Bar (KitchenMode adapté)** | Moyenne | ✅ Oui (adapter sans livraison) | 1-2 jours |
| → Plein écran avec commandes à préparer, timer par boisson, notification quand prêt. | | | |
| **6. Pipeline statuts enrichi** | Moyenne | ✅ Oui (adapter flow Dal Cielo) | 1-2 jours |
| → Ajouter `pending_validation`, `in_preparation`, temps de préparation, `actual_ready_time` | | | |
| **7. Quick Actions par commande** | Moyenne | ✅ Oui (adapter QuickActions) | 1-2 jours |
| → Remise, refus avec motif, délai estimé. | | | |
| **8. Fidélité & Notes clients** | Moyenne | ✅ Oui (adapter ClientsManager) | 1-2 jours |
| → Points fidélité, notes internes, suivi des habitués. | | | |
| **9. Protection CSRF** | Facile | ✅ Oui (copie quasi directe) | 0.5 jour |
| **10. Nettoyage auto commandes** | Facile | ✅ Oui | 0.5 jour |

### 🟡 NICE-TO-HAVE — Amélioration continue

| # | Feature | Complexité | Adaptable Dal Cielo ? | Effort estimé |
|---|---------|------------|----------------------|---------------|
| **11. Top produits** | Facile | ✅ Oui | 0.5 jour |
| **12. Reçus manager** | Moyenne | ✅ Oui (adapter ReceiptsManager) | 1 jour |
| **13. Modération avis** | Moyenne | ✅ Oui (si Pessora ajoute reviews) | 1 jour |
| **14. Import clients CSV** | Facile | ✅ Oui | 0.5 jour |
| **15. Sidebar collapsible** | Facile | ✅ Oui (adapter AdminSidebar) | 0.5 jour |
| **16. WhatsApp / Bot notify** | Lourde | 🟡 Partiellement | 2-3 jours |
| **17. Audit log** | Facile | ✅ Oui (copie adaptée) | 0.5 jour |
| **18. Seed scripts** | Facile | ✅ Oui | 0.5 jour |
| **19. Chef/Produit vedette** | Facile | ✅ Oui (ChefPizzaEditor → FeaturedProduct) | 0.5 jour |

---

## 4. PLAN D'ACTION PRIORISÉ

### Phase 1 — Fondations (Semaine 1)
```
🔴 1. API Routes sécurisées        → Backend solide avant tout le reste
🔴 2. Admin Toast System           → UX immédiate, copiable
🔴 3. Revenue Analytics            → Visibilité business
```

### Phase 2 — Opérations (Semaine 2)
```
🔴 4. Gestion Stocks + Alertes     → Critique pour un bar
🟠 5. Pipeline statuts enrichi     → Flow commandes pro
🟠 6. Mode Bar (KitchenMode)       → Efficacité au comptoir
🟠 7. Quick Actions                → Flexibilité équipe
```

### Phase 3 — Relation client (Semaine 3)
```
🟠 8. Fidélité & Notes clients     → Rétention
🟠 9. CSRF + Nettoyage auto        → Sécurité + hygiène
🟡 10. Top produits                → Visibilité rapide
```

### Phase 4 — Polish (Semaine 4+)
```
🟡 11-19. Reçus, Avis, Import, Sidebar, Audit, Seed, etc.
```

---

## 5. NOTES D'ADAPTATION

### Contexte bar protéiné (vs pizzeria livraison)
- ❌ **Pas de livraison** → supprimer `in_delivery`, `deliveryFee`, `adresse`
- ❌ **Pas de créneaux horaires** → supprimer `preferredTimeSlots`
- ✅ **Sur place / à emporter** → statuts simplifiés : `pending → paid → preparing → ready → completed`
- ✅ **Gammes (Sport/Skin/Wellness)** → spécifique Pessora, à conserver
- ✅ **Événements + Bilans** → exclusif Pessora, différenciant fort

### Stack technique
- Dal Cielo = Next.js App Router → `/api/` route handlers
- Pessora = Vite + React Router → il faut créer des endpoints (Express, Hono, ou Supabase Edge Functions)
- **Recommandation** : utiliser Supabase Edge Functions ou un backend léger (Hono/Express) pour les API routes

### Composants réutilisables directement
- `AdminToast` → copie quasi directe (React pur, pas de dépendance Next.js)
- `StockAlerts` → adapter les appels API
- `RevenueChart` → nécessite Recharts (à ajouter aux deps Pessora)
- `QuickActions` → adapter au contexte bar (pas de WhatsApp, pas de livraison)
- `adminUi.ts` → design tokens réutilisables

---

**Total features Dal Cielo** : 34 features admin distinctes  
**Total features Pessora** : 26 features admin (dont 6 exclusives à Pessora)  
**Features Dal Cielo manquantes dans Pessora** : 19  
**Features Pessora exclusives** : 6 (abonnements, bilans, événements, gammes, contenu, newsletter)

**Score de complétude admin Pessora** : ~55% par rapport à Dal Cielo (hors features exclusives)
