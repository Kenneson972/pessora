# 🌿 Pessobot - Guide Complet

**Pessobot** est l'assistant intelligent de PessÓra, disponible 24/7 pour répondre aux questions des clients.

---

## 📋 Vue d'Ensemble

### Caractéristiques
- 🤖 **Assistant automatique** avec réponses pré-programmées
- 🌿 **Thème organique** harmonisé avec le site PessÓra
- 💬 **Suggestions rapides** pour guider la conversation
- 📱 **Responsive** sur mobile, tablette et desktop
- ⚡ **Rapide** et léger, sans backend complexe
- 🎨 **Mode plein écran** pour conversations longues

### Localisation
Le chatbot est accessible sur **toutes les pages** du site via un bouton FAB (Floating Action Button) en bas à droite de l'écran.

---

## 🎯 Base de Connaissances

Pessobot peut répondre à de nombreuses questions :

### 1. **Horaires d'Ouverture**
Keywords: `horaire`, `heure`, `ouvert`, `fermé`

**Réponse type** :
```
Nous sommes ouverts :

🗓️ Lundi - Vendredi : 9h30 - 18h
🗓️ Samedi : 10h30 - 14h
🗓️ Dimanche : Fermé
```

### 2. **Localisation**
Keywords: `où`, `adresse`, `localisation`, `trouver`

**Réponse type** :
```
Nous sommes situés au :

📍 C.C. La Véranda – Cluny
97200 Fort-de-France, Martinique

Vous pouvez consulter notre page Contact pour plus d'infos !
```

### 3. **Menu Complet**
Keywords: `menu`, `carte`, `boisson`, `prix`

**Réponse type** :
```
Notre menu est divisé en 4 catégories :

✨ WELLNESS (10€) - Beauté & Détox
⚡ ÉNERGIE DRINK (10€) - Pré-Workout
🥤 SHAKES PROTÉINÉS (14€) - Post-Workout
☕ COFFEE (2,50€-4€)

+ Boosters à +1€ pour personnaliser !

Que voulez-vous découvrir ?
```

### 4. **Catégories Spécifiques**

#### Wellness
Keywords: `wellness`, `beauté`, `détox`, `glow`, `skin`

Affiche : GLOW MY SKIN et DETOX MY BODY avec ingrédients et bénéfices

#### Énergie Drink
Keywords: `energie`, `preworkout`, `boost`, `mango`, `lagoon`

Affiche : SPICY MANGO et BLUE LAGOON avec ingrédients et bénéfices

#### Shakes Protéinés
Keywords: `shake`, `proteine`, `postworkout`, `dragon`, `cookie`, `matcha`

Affiche : Les 6 shakes avec calories, protéines, badges qualité

#### Coffee
Keywords: `coffee`, `cafe`, `espresso`

Affiche : ESPRESSO et CAFÉ LONG avec prix

### 5. **Boosters**
Keywords: `booster`, `personnaliser`, `collagene`, `creatine`

**Réponse type** :
```
Nos BOOSTERS (+1€) pour personnaliser :

💊 Collagène - Peau, ongles, cheveux
💊 Créatine - Force & performance
💊 12g Protéines - Récupération
💊 Électrolytes - Hydratation
💊 Fibres - Confort digestif
💊 Aloé Vera - Détox
```

### 6. **Qualité & Allergènes**

#### Végan
Keywords: `vegan`, `vegetarien`, `végétalien`

**Réponse** : Confirmation que toutes les boissons sont disponibles en version 100% végétale

#### Sans Gluten
Keywords: `gluten`, `sans gluten`, `celiac`

**Réponse** : Confirmation que tous les shakes sont sans gluten

#### Calories
Keywords: `calorie`, `kcal`, `nutrition`

**Réponse** : Récap des calories par catégorie

### 7. **Laits Végétaux**
Keywords: `lait`, `avoine`, `amande`, `coco`, `riz`

**Réponse** : Liste des 4 laits végétaux disponibles (inclus dans le prix)

### 8. **Partenariats**

#### GigaFit
Keywords: `gigafit`, `salle`, `sport`, `lamentin`

**Réponse** : Information sur la présence lors des événements GigaFit

#### EN BONS THERMES
Keywords: `thermes`, `massage`, `spa`, `bien-être`

**Réponse** : Information sur la collaboration massage + boissons

### 9. **Concept**
Keywords: `concept`, `pessora`, `histoire`, `mission`

**Réponse** : Présentation du 1er bar protéiné & bien-être de Martinique

---

## 💡 Suggestions Rapides

### Par Défaut (Accueil)
```
- Voir le menu 📋
- Horaires d'ouverture 🕐
- Où êtes-vous ? 📍
- Différence entre les boissons ❓
```

### Après Question Menu
```
- Wellness
- Énergie Drink
- Shakes Protéinés
- Coffee
- Les Boosters
```

### Questions Santé
```
- Sans gluten ?
- Végétalien ?
- Calories et protéines
- Ingrédients
```

---

## 🎨 Design & Style

### Couleurs
- **Primaire** : Vert olive (#3A5F1A → #5B8C3E)
- **Secondaire** : Beige crème (#E8DCC8, #FAF8F3)
- **Accents** : Vert feuille (#6B9544), Bois (#C19A6B)

### Éléments Visuels
- **Avatar** : Icône 🌿 sur fond blanc
- **FAB** : Bouton rond vert en bas à droite
- **Bulles** : Arrondies avec ombres douces
- **Messages assistant** : Fond blanc avec bordure crème
- **Messages utilisateur** : Gradient vert
- **Suggestions** : Boutons arrondis crème avec bordure

### Animations
- **Apparition** : Fade in + slide up (0.3s)
- **Messages** : Slide in (0.3s)
- **Typing** : Trois points animés qui rebondissent
- **Hover** : Scale 1.1 + ombre élargie

---

## 🛠️ Personnalisation

### Fichier : `src/components/common/Chatbot.tsx`

#### Modifier le Message de Bienvenue
```typescript
const welcomeMessage: Message = {
  role: 'assistant',
  content: 'Ton nouveau message de bienvenue ici !',
  timestamp: new Date()
};
```

#### Ajouter une Nouvelle Connaissance
Dans l'objet `KNOWLEDGE_BASE` :

```typescript
const KNOWLEDGE_BASE: Record<string, string> = {
  // ... connaissances existantes
  'nouveau_keyword': 'Réponse à afficher quand ce mot-clé est détecté',
};
```

#### Ajouter des Suggestions Rapides
Dans l'objet `QUICK_SUGGESTIONS` :

```typescript
const QUICK_SUGGESTIONS = {
  // ... suggestions existantes
  nouvelle_categorie: [
    'Suggestion 1',
    'Suggestion 2',
    'Suggestion 3'
  ]
};
```

#### Modifier l'Avatar
Remplacer l'emoji 🌿 par :
- Une autre icône
- Une image (ajouter dans `/public/` et changer le code)

```tsx
// Au lieu de :
<span className="text-2xl">🌿</span>

// Utiliser :
<img src="/pessobot-avatar.png" alt="Pessobot" />
```

---

## 📱 Responsive

### Mobile (< 768px)
- FAB 56x56px
- Chatbot prend toute la largeur moins 40px
- Mode plein écran = 100% de la fenêtre
- Bulles messages max 80% de largeur

### Tablet (768px - 1024px)
- FAB 60x60px
- Chatbot 400px de large
- Bulles messages max 70% de largeur

### Desktop (> 1024px)
- FAB 64x64px
- Chatbot 400px de large
- Mode plein écran = width/height avec marges 24px
- Bulles messages max 70% de largeur

---

## 🔧 Fonctionnalités Techniques

### Session ID
- Stocké dans `localStorage` (non utilisé pour l'instant)
- Prêt pour future intégration backend

### Détection de Keywords
```typescript
const findBestResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  // Cherche correspondance dans KNOWLEDGE_BASE
  for (const [keyword, response] of Object.entries(KNOWLEDGE_BASE)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Réponse par défaut si aucun match
  return 'Message par défaut...';
};
```

### Simulation de Typing
```typescript
setIsTyping(true);

setTimeout(() => {
  // Ajouter message
  setIsTyping(false);
}, 800 + Math.random() * 400); // 800-1200ms aléatoire
```

### Suggestions Dynamiques
Basées sur le contexte de la réponse donnée :
- Mention de "menu" → suggestions de catégories
- Mention de "végan/gluten" → suggestions santé
- Sinon → suggestions par défaut

---

## 🚀 Améliorations Futures

### Backend Integration (Optionnel)
Pour connecter à une API (OpenAI, n8n, etc.) :

```typescript
const sendMessage = async (messageText: string | null = null) => {
  // ... code existant

  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageToSend })
    });

    const data = await response.json();
    // Traiter la réponse
  } catch (error) {
    // Fallback sur réponses locales
  }
};
```

### Fonctionnalités Avancées
- [ ] **Historique** - Sauvegarder les conversations dans localStorage
- [ ] **Feedback** - 👍/👎 sur chaque réponse
- [ ] **Recherche** - Chercher dans l'historique
- [ ] **Export** - Télécharger la conversation
- [ ] **Notifications** - Badge pour nouveaux messages
- [ ] **Multilangue** - Français / Anglais / Créole
- [ ] **Reconnaissance vocale** - Dictée vocale
- [ ] **Emojis** - Sélecteur d'emojis (comme Karibloom)
- [ ] **Images** - Envoyer photos de boissons
- [ ] **Intégration WhatsApp** - Passer la conversation sur WhatsApp

---

## 🐛 Dépannage

### Problème : Le chatbot ne s'affiche pas
**Solution** : Vérifier que `<Chatbot />` est bien importé dans `App.tsx`

### Problème : Les réponses ne marchent pas
**Solution** : Vérifier les keywords dans `KNOWLEDGE_BASE`

### Problème : Erreur CSS
**Solution** : Vérifier que `Chatbot.css` est bien importé et sans erreurs de syntaxe

### Problème : Le FAB est caché derrière d'autres éléments
**Solution** : Augmenter le `z-index` dans `Chatbot.css`

---

## ✅ Checklist de Lancement

Avant de mettre en production :

- [x] Message de bienvenue personnalisé
- [x] Base de connaissances complète
- [x] Suggestions rapides pertinentes
- [x] Design harmonisé avec le site
- [x] Responsive testé sur mobile/tablette/desktop
- [ ] Tester toutes les questions fréquentes
- [ ] Vérifier l'orthographe des réponses
- [ ] Ajouter avatar personnalisé (optionnel)
- [ ] Configurer analytics (optionnel)

---

**Pessobot créé le** : 30 Janvier 2026
**Version** : 1.0.0
**Style** : Minimaliste Organique
**Framework** : React + TypeScript
