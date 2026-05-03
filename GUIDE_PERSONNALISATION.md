# 🎨 Guide de Personnalisation - PessÓra

Ce guide vous aidera à personnaliser le site web de PessÓra selon vos besoins.

## 📋 Table des Matières

1. [Modifier les Couleurs](#modifier-les-couleurs)
2. [Ajouter/Modifier le Menu](#ajoutermodifier-le-menu)
3. [Mettre à Jour les Informations](#mettre-à-jour-les-informations)
4. [Ajouter des Images](#ajouter-des-images)
5. [Intégrer Instagram Feed](#intégrer-instagram-feed)
6. [Ajouter Google Maps](#ajouter-google-maps)

---

## 1. Modifier les Couleurs

### Palette Actuelle
- **Bleu profond** : `#1E40AF` (couleur primaire)
- **Bleu électrique** : `#3B82F6` (couleur primaire claire)
- **Jaune** : `#FCD34D` (accent)
- **Vert** : `#10B981` (accent)

### Fichiers à Modifier

#### a) `tailwind.config.js`
```javascript
colors: {
  primary: {
    DEFAULT: '#1E40AF',  // Votre couleur primaire
    light: '#3B82F6',     // Version claire
    dark: '#1E3A8A',      // Version foncée
  },
  accent: {
    yellow: '#FCD34D',    // Accent 1
    green: '#10B981',     // Accent 2
    cream: '#FEF3C7',     // Accent 3
  },
}
```

#### b) `src/index.css`
```css
:root {
  --primary: #1E40AF;
  --primary-light: #3B82F6;
  --primary-dark: #1E3A8A;
  --accent-yellow: #FCD34D;
  --accent-green: #10B981;
  --accent-cream: #FEF3C7;
}
```

---

## 2. Ajouter/Modifier le Menu

### Fichier : `src/data/menuData.ts`

#### Ajouter une nouvelle boisson :

```typescript
{
  id: 'ma-boisson-unique',           // ID unique
  name: 'Ma Super Boisson',          // Nom affiché
  description: 'Description...',     // Description
  category: 'shakes',                // Catégorie
  benefits: ['Énergie', 'Vitamines'], // Bénéfices
  icon: '🥤'                          // Emoji
}
```

#### Catégories disponibles :
- `'coffee'` - Coffee
- `'lattes'` - Lattes
- `'shakes'` - Shakes Protéinés
- `'preworkout'` - Pré-Workout & Énergie
- `'autres'` - Autres Boissons

#### Exemple complet :

```typescript
export const menuItems: MenuItem[] = [
  // ... boissons existantes ...
  {
    id: 'shake-cookies',
    name: 'Cookies & Cream Shake',
    description: 'Shake protéiné au goût cookies, irrésistible',
    category: 'shakes',
    benefits: ['25g protéines', 'Gourmand'],
    icon: '🍪'
  }
];
```

---

## 3. Mettre à Jour les Informations

### Fichier : `src/data/infoData.ts`

#### a) Informations du Bar

```typescript
export const barInfo = {
  name: 'PessÓra',
  tagline: 'Votre nouveau slogan',

  address: {
    street: 'Votre adresse',
    city: 'Votre ville',
    postalCode: '97200',
    fullAddress: 'Adresse complète',
    mapsUrl: 'https://goo.gl/maps/VOTRE_LIEN'  // ⚠️ Important
  },

  hours: {
    weekdays: {
      days: 'Lundi - Vendredi',
      hours: '9h30 - 18h'              // Modifier ici
    },
    // ...
  },

  contact: {
    phone: '+596 696 XX XX XX',        // Votre numéro
    email: 'contact@pessora.mq',
    instagram: '@pessora.mq',
    instagramUrl: 'https://www.instagram.com/pessora.mq/'
  }
};
```

#### b) Ajouter un Nouveau Partenariat

```typescript
export const partnerships = [
  // ... partenariats existants ...
  {
    id: 'nouveau-partenaire',
    name: 'Nom du Partenaire',
    description: 'Description de la collaboration',
    type: 'Type (ex: Salle de sport)',
    icon: '🏋️',
    status: 'active'
  }
];
```

#### c) Ajouter un Événement

```typescript
export const events = [
  {
    id: 'mon-event',
    title: 'Titre de l\'événement',
    date: '15 Mars 2026',               // Date
    location: 'Lieu',
    description: 'Description...',
    type: 'popup'                       // 'popup' ou 'event'
  }
];
```

---

## 4. Ajouter des Images

### Structure des Images

```
public/
├── favicon.svg               # Icône du site (déjà créé)
├── logo.svg                  # Logo PessÓra (à créer)
└── images/
    ├── hero-bg.jpg          # Image de fond hero (optionnel)
    ├── drinks/              # Photos de boissons
    │   ├── shake1.jpg
    │   └── coffee1.jpg
    └── events/              # Photos d'événements
        └── gigafit.jpg
```

### Utiliser les Images dans le Code

#### Dans un composant React :

```tsx
<img
  src="/images/drinks/shake1.jpg"
  alt="Chocolate Power Shake"
  className="w-full h-64 object-cover rounded-lg"
/>
```

#### Avec fond d'image (Hero Section) :

```tsx
<section
  className="h-screen bg-cover bg-center"
  style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
>
  {/* Contenu */}
</section>
```

---

## 5. Intégrer Instagram Feed

### Option 1 : Widget Instagram Officiel

#### Étape 1 : Obtenir le Code d'Intégration
1. Visitez [Instagram Embed](https://developers.facebook.com/docs/instagram/embedding)
2. Connectez votre compte Instagram Business
3. Générez le code d'intégration

#### Étape 2 : Ajouter dans le Site

Dans `src/pages/Home.tsx` (section Instagram) :

```tsx
{/* CTA Instagram */}
<section className="section-padding bg-white">
  <div className="container-custom">
    <h2 className="text-4xl font-bold mb-8 text-gradient text-center">
      Suivez-Nous sur Instagram
    </h2>

    {/* Intégration Instagram Feed */}
    <div className="max-w-5xl mx-auto">
      <div
        className="elfsight-app-YOUR-WIDGET-ID"
        data-elfsight-app-lazy
      ></div>
    </div>

    {/* Bouton */}
    <div className="text-center mt-8">
      <a
        href="https://www.instagram.com/pessora.mq/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        Suivre @pessora.mq
      </a>
    </div>
  </div>
</section>
```

### Option 2 : Utiliser un Service Tiers

#### Services Recommandés :
- **Elfsight** : [elfsight.com](https://elfsight.com/instagram-feed-instashow/)
- **Snapwidget** : [snapwidget.com](https://snapwidget.com/)
- **Behold** : [behold.so](https://behold.so/)

#### Installation (exemple avec Elfsight) :

1. Créez un compte sur Elfsight
2. Créez un widget Instagram Feed
3. Copiez le code fourni
4. Ajoutez-le dans `index.html` (avant `</body>`) :

```html
<script src="https://apps.elfsight.com/p/platform.js" defer></script>
```

5. Ajoutez le widget dans votre page :

```tsx
<div className="elfsight-app-YOUR-APP-ID"></div>
```

---

## 6. Ajouter Google Maps

### Étape 1 : Obtenir le Lien Google Maps

1. Allez sur [Google Maps](https://maps.google.com)
2. Recherchez votre adresse : "C.C. La Véranda, Cluny, Fort-de-France"
3. Cliquez sur "Partager" > "Intégrer une carte"
4. Copiez le lien d'intégration (iframe)

### Étape 2 : Mettre à Jour le Code

#### a) Dans `src/data/infoData.ts` :

```typescript
address: {
  // ...
  mapsUrl: 'https://goo.gl/maps/VOTRE_LIEN_ICI'
}
```

#### b) Dans `src/pages/Contact.tsx` (remplacer le placeholder) :

```tsx
{/* Carte Google Maps */}
<div className="max-w-5xl mx-auto">
  <div className="aspect-video rounded-xl overflow-hidden">
    <iframe
      src="https://www.google.com/maps/embed?pb=VOTRE_CODE_EMBED"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen={true}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</div>
```

### Exemple de Code d'Intégration Complet :

```tsx
<section className="section-padding bg-gray-50">
  <div className="container-custom">
    <h2 className="text-4xl font-bold mb-8 text-gradient text-center">
      Comment Nous Trouver
    </h2>

    {/* Carte Google Maps */}
    <div className="max-w-5xl mx-auto">
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977890194445!2d-61.0699!3d14.6095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM2JzM0LjIiTiA2McKwMDQnMTEuNiJX!5e0!3m2!1sfr!2smq!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localisation PessÓra"
        ></iframe>
      </div>
    </div>
  </div>
</section>
```

---

## 📝 Checklist Avant Déploiement

- [ ] ✅ Couleurs personnalisées
- [ ] ✅ Menu à jour avec toutes les boissons
- [ ] ✅ Informations du bar complètes (adresse, horaires, contact)
- [ ] ✅ Lien Google Maps fonctionnel
- [ ] ✅ Logo et favicon ajoutés
- [ ] ✅ Photos de produits ajoutées
- [ ] ✅ Instagram feed intégré
- [ ] ✅ Mentions légales complétées
- [ ] ✅ CGV complétées
- [ ] ✅ Numéro de téléphone ajouté
- [ ] ✅ Partenariats et événements à jour
- [ ] ✅ Test sur mobile, tablette et desktop

---

## 🆘 Besoin d'Aide ?

Si vous avez des questions ou rencontrez des problèmes :

1. Consultez d'abord le README.md
2. Vérifiez que toutes les dépendances sont installées : `npm install`
3. Essayez de rebuild : `npm run build`
4. Contactez le développeur ou consultez la documentation React/Vite

---

**Bon courage avec votre personnalisation ! 🚀**
