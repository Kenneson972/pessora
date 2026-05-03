# 🥤 Guide du Menu PessÓra

Ce document décrit l'organisation du menu et comment le modifier.

## 📋 Structure du Menu

Le menu est divisé en **4 catégories principales** :

### 1. ✨ WELLNESS - Bien-être & Douceur
**Prix** : 10€
**Calories** : 30 kcal
**Cible** : Beauté, détox, santé au quotidien

#### Boissons
- **GLOW MY SKIN** - Le cocktail beauté
  - Hibiscus, Collagène, Fraise, Citron
  - Bénéfices : Articulation, Circulation, Peau, Ongles et cheveux

- **DETOX MY BODY** - Le nettoyage interne
  - Thé vert cardamome, Verveine, Menthe, Yuzu, Aloé Vera
  - Bénéfices : Brûle graisse, Confort digestif, Effet drainant

---

### 2. ⚡ ÉNERGIE DRINK - Pré-Workout
**Prix** : 10€
**Calories** : 50 kcal
**Cible** : Sportifs avant séance, boost d'énergie

#### Boissons
- **SPICY MANGO** - Le boost tropical
  - Mangue épicée, Açaï, Créatine, Hibiscus, Orange, Électrolytes
  - Bénéfices : Énergie, Endurance, Puissance, Hydratation, Anti-crampe

- **BLUE LAGOON** - L'électrochoc frais
  - Créatine, Yuzu, Açaï, Citron, Curaçao, Menthe, Caféine de Guarana, Biotine, Taurine
  - Bénéfices : Énergie rapide, Endurance, Puissance, Hydratation, Anti-crampe

---

### 3. 🥤 SHAKES PROTÉINÉS - Post-Workout
**Prix** : 14€
**Calories** : 220-250 kcal
**Protéines** : 18-21g
**Badges** : 🌱 Végan • 🌾 Sans Gluten • 💊 25 Vitamines & Minéraux

#### Les 6 Shakes
1. **PINK DRAGON** (230 kcal, 21g prot)
   - Fruit du dragon, Collagène, Fraise
   - Pitch : "Fruité & Beauté"

2. **COOKIE CREAM** (220 kcal, 18g prot)
   - Cookies, Caramel, Chocolat
   - Pitch : "Gourmandise pure"

3. **CHOCO PROT** (250 kcal, 20g prot)
   - Cacao, Vanille
   - Pitch : "Le classique efficace"

4. **ICED CARAMEL LATTE** (220 kcal, 18g prot)
   - Vanille, Caramel, Café
   - Pitch : "Le coup de fouet gourmand"

5. **TIRAMISU CREAMY** (220 kcal, 18g prot)
   - Spéculos, Café, Vanille, Poudre de cacao
   - Pitch : "Dessert liquide"

6. **GLAM MATCHA** (220 kcal, 18g prot)
   - Matcha, Vanille, Framboise, Lait Végétal
   - Pitch : "L'option zen & fruitée"

---

### 4. ☕ COFFEE
**Prix** : 2,50€ - 4€

#### Boissons
- **ESPRESSO** - 2,50€
  - Café arabica court et intense

- **CAFÉ LONG** - 4€
  - Café arabica allongé et doux

---

## 💪 LES EXTRAS (Upsell Important !)

### Nos Boosters (+1€)
1. **Collagène** - Peau, ongles, cheveux
2. **Créatine** - Force & performance
3. **12g Protéines** - Récupération musculaire
4. **Électrolytes** - Hydratation & anti-crampe
5. **Fibres** - Confort digestif
6. **Aloé Vera** - Détox & hydratation

### Boissons Végétales (Inclus)
- 🌾 Avoine
- 🌰 Amandes
- 🥥 Coco
- 🌾 Riz

---

## 🎨 Affichage sur le Site

### Cartes de Boissons
Chaque carte affiche :
- **Icône** en haut à droite
- **Nom** en gros titre
- **Prix** en gros (couleur verte)
- **Calories et Protéines** (si applicable)
- **Pitch** en italique
- **Ingrédients** en badges crème
- **Bénéfices** en badges verts avec ✓
- **Badges qualité** (végan, sans gluten, vitamines) si applicable

### Filtres
- 📋 Tout Voir
- ✨ Wellness
- ⚡ Énergie
- 🥤 Shakes
- ☕ Coffee

---

## 📝 Comment Modifier le Menu

### Fichier : `src/data/menuData.ts`

#### Ajouter une nouvelle boisson Wellness

```typescript
{
  id: 'ma-boisson',
  name: 'MA NOUVELLE BOISSON',
  description: 'Description courte',
  category: 'wellness',
  price: 10,
  calories: 30,
  ingredients: ['Ingrédient 1', 'Ingrédient 2'],
  benefits: ['Bénéfice 1', 'Bénéfice 2'],
  pitch: 'Le pitch accrocheur',
  icon: '✨',
  badges: []
}
```

#### Ajouter un nouveau Shake

```typescript
{
  id: 'mon-shake',
  name: 'MON SHAKE',
  description: 'Description',
  category: 'shakes',
  price: 14,
  calories: 230,
  protein: 20,
  ingredients: ['Ingrédient 1', 'Ingrédient 2'],
  benefits: ['Récupération', '20g protéines', '25 vitamines & minéraux'],
  pitch: 'Le pitch',
  icon: '🥤',
  badges: ['vegan', 'glutenfree', 'vitamins']
}
```

#### Ajouter un Booster

```typescript
export const boosters: Booster[] = [
  // ... boosters existants
  {
    id: 'mon-booster',
    name: 'Mon Nouveau Booster',
    price: 1,
    description: 'Description courte'
  }
];
```

#### Ajouter un Lait Végétal

```typescript
export const milkOptions: MilkOption[] = [
  // ... laits existants
  { id: 'mon-lait', name: 'Mon Lait', icon: '🌾' }
];
```

---

## 🎯 Recommandations Marketing

### Upsell Boosters
La section boosters est stratégique pour augmenter le panier moyen :
- Position visible après les catégories principales
- Prix attractif (+1€)
- Descriptions claires des bénéfices
- Design engageant avec icônes

### Messages Clés
1. **Sans artifices** - Aucun arôme ni colorant artificiel
2. **Options véganes** - 100% végétal disponible
3. **Enrichi** - 25 vitamines & minéraux dans les shakes
4. **Personnalisation** - Adaptez avec les boosters

### Call-to-Actions
- "Prêt à Tester ?"
- "Nous Trouver"
- "Voir les Événements"

---

## 📊 Analytics

### Métriques à Suivre
1. **Catégorie la plus consultée** (filtres cliqués)
2. **Boissons les plus vues** (scrolls, clics)
3. **Taux d'ajout de boosters** (si fonctionnalité)
4. **Conversion vers Contact/Événements**

### Optimisations Futures
- Système de favoris
- Calcul nutritionnel personnalisé
- Recommandations basées sur objectifs
- Système de précommande/click & collect

---

## ✅ Checklist Qualité

- [x] Prix affichés pour chaque boisson
- [x] Calories et protéines visibles
- [x] Ingrédients listés
- [x] Bénéfices mis en avant
- [x] Badges qualité (végan, sans gluten, vitamines)
- [x] Boosters en section dédiée
- [x] Laits végétaux présentés
- [x] Mentions qualité (sans artifices)
- [x] CTAs vers Contact et Événements
- [x] Design responsive (mobile, tablette, desktop)

---

**Menu créé le** : 30 Janvier 2026
**Version** : 2.0.0
**Dernière mise à jour** : Menu complet avec vraies données PessÓra
