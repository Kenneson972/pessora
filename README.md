# 🥤 PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique

Site web officiel de PessÓra, le premier bar protéiné et bien-être de Martinique.

## 🎯 Fonctionnalités

- ✅ Page d'accueil avec présentation du concept
- ✅ Page Concept (Notre histoire et nos valeurs)
- ✅ Menu interactif avec filtres par catégorie
- ✅ Page Événements & Partenariats
- ✅ Page Contact avec formulaire
- ✅ Design responsive (mobile-first)
- ✅ Animations fluides avec Tailwind CSS
- ✅ Navigation intuitive
- ✅ Mentions Légales et CGV

## 🛠️ Technologies Utilisées

- **React 18** avec TypeScript
- **Vite** (build tool moderne et rapide)
- **React Router** v6 (navigation)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Framer Motion** (animations - optionnel)

## 🚀 Installation

### Prérequis
- Node.js 18+ et npm

### Étapes

1. **Cloner le projet** (si depuis Git)
```bash
cd PESSORA
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

## 📦 Scripts Disponibles

```bash
npm run dev       # Lance le serveur de développement
npm run build     # Build de production
npm run preview   # Prévisualise le build de production
npm run lint      # Vérifie le code avec ESLint
```

## 🎨 Personnalisation

### Couleurs
Les couleurs du thème sont définies dans `tailwind.config.js` et `src/index.css` :

- **Bleu profond** : `#1E40AF` (primaire)
- **Bleu électrique** : `#3B82F6` (primaire clair)
- **Jaune** : `#FCD34D` (accent)
- **Vert** : `#10B981` (accent)

### Données
Les données du site (menu, infos bar, partenariats) sont centralisées dans :
- `src/data/menuData.ts` - Menu des boissons
- `src/data/infoData.ts` - Informations du bar et partenariats

## 📂 Structure du Projet

```
PESSORA/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Navigation
│   │   │   └── Footer.tsx       # Pied de page
│   │   └── common/
│   │       └── ScrollToTop.tsx  # Scroll automatique
│   ├── pages/
│   │   ├── Home.tsx             # Page d'accueil
│   │   ├── Concept.tsx          # Page concept
│   │   ├── Menu.tsx             # Page menu
│   │   ├── Evenements.tsx       # Page événements
│   │   ├── Contact.tsx          # Page contact
│   │   ├── MentionsLegales.tsx  # Mentions légales
│   │   └── CGV.tsx              # CGV
│   ├── data/
│   │   ├── menuData.ts          # Données du menu
│   │   └── infoData.ts          # Infos bar
│   ├── App.tsx                  # Router principal
│   ├── main.tsx                 # Point d'entrée
│   └── index.css                # Styles globaux
├── public/                       # Assets statiques
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 🔧 Configuration à Compléter

### 1. Google Maps
Dans `src/data/infoData.ts`, remplacer :
```typescript
mapsUrl: 'https://goo.gl/maps/YOUR_MAP_LINK'
```

### 2. Coordonnées
Dans `src/data/infoData.ts`, compléter :
```typescript
phone: '+596 696 XX XX XX'
```

### 3. Mentions Légales
Dans `src/pages/MentionsLegales.tsx`, compléter les informations légales de l'entreprise.

### 4. Logo et Favicon
- Ajouter le logo dans `public/logo.svg`
- Ajouter le favicon dans `public/favicon.svg`

## 🌐 Déploiement

### Option 1 : Netlify (Recommandé)
1. Créer un compte sur [Netlify](https://www.netlify.com/)
2. Connecter le repository Git
3. Configuration build :
   - Build command: `npm run build`
   - Publish directory: `dist`

### Option 2 : Vercel
1. Créer un compte sur [Vercel](https://vercel.com/)
2. Importer le projet
3. Le build se fait automatiquement

### Option 3 : Build manuel
```bash
npm run build
```
Les fichiers seront dans le dossier `dist/` à uploader sur votre hébergeur.

## 📱 Responsive Design

Le site est optimisé pour tous les écrans :
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🎯 SEO

- Meta tags configurés dans `index.html`
- Structure sémantique HTML5
- URLs propres avec React Router
- Performances optimisées avec Vite

## 📞 Support

Pour toute question concernant le site :
- Email : contact@pessora.mq
- Instagram : [@pessora.mq](https://www.instagram.com/pessora.mq/)

## 📄 Licence

© 2026 PessÓra. Tous droits réservés.

---

**Développé avec ❤️ pour PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique**
