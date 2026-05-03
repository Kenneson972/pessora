# 🔐 Espace Membre PessÓra - Guide Complet

Documentation complète de l'espace membre et du système d'abonnements.

---

## 📋 Vue d'Ensemble

L'espace membre de PessÓra est une plateforme complète permettant aux clients de :
- Gérer leur abonnement
- Suivre leurs points de fidélité
- Consulter leur historique
- Échanger des récompenses
- Parrainer des amis

---

## 🏗️ Architecture

### Structure des Fichiers

```
src/
├── contexts/
│   └── AuthContext.tsx           # Contexte d'authentification global
├── components/
│   ├── ProtectedRoute.tsx        # Protection des routes membres
│   └── member/
│       └── MemberLayout.tsx      # Layout avec sidebar navigation
├── pages/
│   ├── auth/
│   │   ├── Login.tsx             # Page de connexion
│   │   └── Register.tsx          # Page d'inscription
│   └── member/
│       ├── Dashboard.tsx         # Tableau de bord
│       ├── Subscription.tsx      # Gestion abonnement
│       ├── Profile.tsx           # Profil utilisateur
│       ├── History.tsx           # Historique activités
│       └── Loyalty.tsx           # Fidélité & récompenses
```

---

## 🔑 Système d'Authentification

### AuthContext

Le contexte d'authentification gère :
- État de connexion utilisateur
- Informations du profil
- Abonnement actif
- Actions login/logout/register

#### Types principaux

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  plan: 'free' | 'starter' | 'premium' | 'vip';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
}
```

### Utilisation dans un composant

```typescript
import { useAuth } from '../../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, subscription, login, logout } = useAuth();

  // Utilisation...
};
```

---

## 🎨 Pages de l'Espace Membre

### 1. **Dashboard** (`/mon-espace`)

**Fonctionnalités :**
- Vue d'ensemble du compte
- Statistiques (visites, points, économies)
- Activité récente
- Raccourcis rapides

**Composants clés :**
- Cards statistiques (abonnement, visites, points, économies)
- Liste des activités récentes
- Widget upgrade abonnement
- Widget récompenses à venir

**Données affichées :**
```typescript
const stats = {
  visits: 12,           // Visites ce mois
  points: 340,          // Points actuels
  savings: 45.50,       // Économies totales
  nextReward: 160       // Points pour prochaine récompense
};
```

### 2. **Abonnement** (`/mon-espace/abonnement`)

**Fonctionnalités :**
- Affichage abonnement actuel
- Catalogue des plans disponibles
- Upgrade/downgrade instant
- FAQ abonnements

**Plans disponibles :**

#### Gratuit (0€/mois)
- Points fidélité de base
- Offres ponctuelles
- Accès au menu complet

#### Starter (9.99€/mois) - Populaire
- 5% réduction sur toutes les boissons
- Points x1.5 sur chaque achat
- 1 boisson offerte par mois
- Support prioritaire

#### Premium (19.99€/mois) - Meilleure valeur
- 15% réduction sur toutes les boissons
- Points x2 sur chaque achat
- 2 boissons offertes par mois
- Boosters gratuits (1 par boisson)
- Événements exclusifs

#### VIP (39.99€/mois) - Exclusif
- 25% réduction sur toutes les boissons
- Points x3 sur chaque achat
- 5 boissons offertes par mois
- Tous les boosters gratuits
- Boisson personnalisée à ton nom
- Événements VIP privés

**Changement d'abonnement :**
```typescript
const handleSelectPlan = async (planId: string) => {
  await updateSubscription(planId);
  // Le changement est effectif immédiatement
};
```

### 3. **Profil** (`/mon-espace/profil`)

**Fonctionnalités :**
- Modification informations personnelles
- Gestion photo de profil
- Paramètres de sécurité
- Suppression de compte

**Formulaire modifiable :**
- Prénom / Nom
- Email
- Téléphone
- Photo de profil

**Section sécurité :**
- Changement mot de passe
- Authentification 2FA (à venir)

### 4. **Historique** (`/mon-espace/historique`)

**Fonctionnalités :**
- Liste complète des activités
- Filtres par type (visites, achats, récompenses)
- Recherche dans l'historique
- Export des données
- Statistiques globales

**Types d'activité :**
- 📅 **Visite** : Check-in au bar (+10 points)
- 🥤 **Achat** : Achat d'une boisson (+10-30 points selon montant)
- 🎁 **Récompense** : Échange de points (-100 à -1000 points)

**Exemple d'historique :**
```typescript
{
  id: '1',
  date: '2025-01-28',
  type: 'purchase',
  title: 'Pink Dragon Shake',
  description: '1x Pink Dragon (14€) + Collagène (+1€)',
  points: 15,
  amount: 15
}
```

### 5. **Fidélité** (`/mon-espace/fidelite`)

**Fonctionnalités :**
- Suivi des points
- Catalogue de récompenses
- Système de niveaux
- Programme de parrainage

**Système de niveaux :**
1. 🌱 **Débutant** (0 pts)
2. 🌿 **Habitué** (500 pts)
3. ⭐ **Régulier** (1500 pts)
4. 💎 **Expert** (3000 pts)
5. 👑 **Légende** (5000 pts)

**Récompenses disponibles :**

| Récompense | Points | Description |
|------------|--------|-------------|
| Booster gratuit | 100 | 1 booster de ton choix |
| Réduction 10% | 200 | Valable sur prochaine commande |
| Boisson gratuite | 500 | Jusqu'à 14€ |
| Shake Premium | 800 | 1 shake + 2 boosters |
| Événement VIP | 1000 | Invitation événement exclusif |
| Pack découverte | 1500 | 3 boissons wellness |

**Programme de parrainage :**
- Code unique par utilisateur
- 100 points pour le parrain
- 100 points pour le filleul
- Récompenses débloquées à 5, 10, 20 parrainages

---

## 🎯 Fonctionnalités Backend (À Implémenter)

### Authentification

```typescript
// API Endpoints nécessaires
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Utilisateurs

```typescript
// API Endpoints nécessaires
GET /api/users/me
PUT /api/users/me
PUT /api/users/me/avatar
DELETE /api/users/me
PUT /api/users/me/password
```

### Abonnements

```typescript
// API Endpoints nécessaires
GET /api/subscriptions/plans
GET /api/subscriptions/current
POST /api/subscriptions/subscribe
PUT /api/subscriptions/change
POST /api/subscriptions/cancel
POST /api/subscriptions/payment  // Intégration Stripe/PayPal
```

### Fidélité

```typescript
// API Endpoints nécessaires
GET /api/loyalty/points
GET /api/loyalty/rewards
POST /api/loyalty/redeem
GET /api/loyalty/history
GET /api/loyalty/referral
POST /api/loyalty/referral/claim
```

### Historique

```typescript
// API Endpoints nécessaires
GET /api/history?type=all|visits|purchases|rewards
GET /api/history/stats
GET /api/history/export
```

---

## 🔒 Protection des Routes

Les routes membres sont protégées par le composant `ProtectedRoute` :

```typescript
<Route
  path="/mon-espace"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Comportement :**
- Si non authentifié → redirection vers `/connexion`
- Si authentifié → affichage du contenu
- Loading state pendant la vérification

---

## 💾 Stockage Local (Temporaire)

**Actuellement stocké dans localStorage :**
- `pessora_user` : Données utilisateur
- `pessora_subscription` : Abonnement actif

⚠️ **À remplacer par :**
- JWT tokens (access + refresh)
- Cookies sécurisés (httpOnly)
- Session storage pour données temporaires

---

## 🎨 Design System

### Couleurs Espace Membre

```css
/* Abonnements */
Free:    gray-500    #6B7280
Starter: blue-500    #3B82F6
Premium: purple-500  #A855F7
VIP:     yellow-400  #FACC15

/* Status */
Active:    green-500  #22C55E
Expired:   red-500    #EF4444
Cancelled: gray-500   #6B7280
```

### Composants Réutilisables

**MemberLayout :**
- Sidebar navigation desktop
- Mobile menu hamburger
- User info card
- Logout button

**Stats Cards :**
- Icône + valeur + label
- Gradient backgrounds pour abonnement
- Hover effects

---

## 📱 Responsive Design

### Breakpoints

```css
Mobile:  < 768px  - Menu hamburger, sidebar cachée
Tablet:  768-1024px - Menu hamburger, cartes 2 colonnes
Desktop: > 1024px - Sidebar visible, cartes 3-4 colonnes
```

### Mobile Navigation

- Header simplifié avec burger menu
- Sidebar transformée en fullscreen menu
- Boutons CTA plus grands
- Cards empilées en 1 colonne

---

## ⚡ Performance

### Optimisations Frontend

- Lazy loading des images avatars
- Code splitting par route
- Memoization des composants lourds
- Debounce sur recherche historique

### Optimisations à Prévoir

```typescript
// React Query pour cache API
import { useQuery } from '@tanstack/react-query';

const { data: subscription } = useQuery({
  queryKey: ['subscription'],
  queryFn: fetchSubscription,
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

---

## 🔧 Configuration & Personnalisation

### Modifier les Plans d'Abonnement

Fichier : `src/pages/member/Subscription.tsx`

```typescript
const plans = [
  {
    id: 'nouveau-plan',
    name: 'Nom du Plan',
    price: 29.99,
    icon: '🎯',
    color: 'from-color-to-color',
    features: [
      'Avantage 1',
      'Avantage 2'
    ]
  }
];
```

### Modifier les Récompenses

Fichier : `src/pages/member/Loyalty.tsx`

```typescript
const rewards = [
  {
    id: 'nouvelle-recompense',
    name: 'Nom Récompense',
    description: 'Description',
    points: 300,
    icon: '🎁',
    category: 'drink|booster|discount|event|pack'
  }
];
```

### Modifier les Niveaux

```typescript
const levelConfig = [
  {
    level: 1,
    name: 'Débutant',
    points: 0,
    icon: '🌱',
    color: 'from-gray-400 to-gray-500'
  }
  // Ajouter plus de niveaux...
];
```

---

## 🧪 Tests (À Implémenter)

### Tests Unitaires

```typescript
// Example avec Vitest
describe('AuthContext', () => {
  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.login('test@test.com', 'password'));
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Tests E2E

```typescript
// Example avec Playwright
test('user can subscribe to premium', async ({ page }) => {
  await page.goto('/connexion');
  await page.fill('[name="email"]', 'test@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.goto('/mon-espace/abonnement');
  await page.click('text=Passer à Premium');
  await expect(page.locator('text=Premium')).toBeVisible();
});
```

---

## 🚀 Déploiement

### Variables d'Environnement

```env
# Frontend
VITE_API_URL=https://api.pessora.mq
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Backend (à créer)
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=...
```

### Checklist Déploiement

- [ ] Remplacer mock data par vraies API calls
- [ ] Configurer JWT authentication
- [ ] Intégrer Stripe/PayPal pour paiements
- [ ] Configurer emails transactionnels (SendGrid/Mailgun)
- [ ] Mettre en place webhook Stripe
- [ ] Configurer CORS backend
- [ ] SSL/HTTPS obligatoire
- [ ] Rate limiting API
- [ ] Logging et monitoring
- [ ] Backup base de données
- [ ] Tests automatisés

---

## 📈 Métriques à Suivre

### KPIs Abonnements

- Taux de conversion Gratuit → Payant
- Churn rate par plan
- LTV (Lifetime Value) par utilisateur
- MRR (Monthly Recurring Revenue)

### KPIs Fidélité

- Points moyens par utilisateur
- Taux d'échange de récompenses
- Taux de parrainage
- Visites moyennes par mois

---

## 🛠️ Maintenance

### Tâches Récurrentes

**Quotidien :**
- Monitoring erreurs Sentry
- Vérification transactions Stripe

**Hebdomadaire :**
- Analyse métriques abonnements
- Review feedback utilisateurs

**Mensuel :**
- Audit sécurité
- Optimisation performances
- Mise à jour dépendances

---

## 📞 Support & Contact

Pour toute question sur l'espace membre :
- Documentation technique : ce fichier
- Backend API : à créer
- Support client : contact@pessora.mq

---

**Créé le** : 30 Janvier 2026
**Version** : 1.0.0
**Status** : ✅ Frontend Ready - Backend à implémenter
**Stack** : React 18 + TypeScript + Vite + Tailwind CSS
