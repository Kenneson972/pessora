# 🚀 Guide de Déploiement - PessÓra

Ce guide détaille les différentes options pour déployer le site web de PessÓra en production.

## 📋 Table des Matières

1. [Préparation au Déploiement](#préparation-au-déploiement)
2. [Option 1 : Netlify (Recommandé)](#option-1--netlify-recommandé)
3. [Option 2 : Vercel](#option-2--vercel)
4. [Option 3 : Hébergeur Classique (o2switch, OVH, etc.)](#option-3--hébergeur-classique)
5. [Configuration DNS](#configuration-dns)
6. [Optimisations Post-Déploiement](#optimisations-post-déploiement)

---

## Préparation au Déploiement

### 1. Vérifier que Tout Fonctionne Localement

```bash
# Tester le serveur de développement
npm run dev

# Tester le build de production
npm run build
npm run preview
```

### 2. Checklist Avant Déploiement

- [ ] Toutes les informations sont à jour (menu, horaires, contact)
- [ ] Le lien Google Maps est configuré
- [ ] Le numéro de téléphone est ajouté
- [ ] Les mentions légales sont complètes
- [ ] Le logo et le favicon sont ajoutés
- [ ] Les images sont optimisées
- [ ] Le site fonctionne sur mobile, tablette et desktop
- [ ] Pas d'erreurs de console dans le navigateur

### 3. Optimiser les Images

Avant de déployer, optimisez vos images :
- Utilisez des formats WebP ou AVIF
- Compressez les images avec [TinyPNG](https://tinypng.com/) ou [ImageOptim](https://imageoptim.com/)
- Ciblez max 200KB par image

---

## Option 1 : Netlify (Recommandé)

**Avantages** :
- ✅ Gratuit pour les petits sites
- ✅ HTTPS automatique
- ✅ CDN mondial
- ✅ Déploiement automatique à chaque push Git
- ✅ Formulaires de contact intégrés
- ✅ Très simple à configurer

### Étapes de Déploiement

#### 1. Créer un Compte Netlify

Allez sur [netlify.com](https://www.netlify.com/) et créez un compte (gratuit).

#### 2. Préparer le Projet

Si ce n'est pas déjà fait, initialisez Git :

```bash
git init
git add .
git commit -m "Initial commit - Site PessÓra"
```

#### 3. Pousser sur GitHub

```bash
# Créez un repo sur GitHub, puis :
git remote add origin https://github.com/VOTRE-USERNAME/pessora.git
git branch -M main
git push -u origin main
```

#### 4. Connecter à Netlify

1. Sur Netlify, cliquez sur "Add new site" > "Import an existing project"
2. Connectez votre compte GitHub
3. Sélectionnez le repository `pessora`
4. Configuration build :
   ```
   Build command: npm run build
   Publish directory: dist
   ```
5. Cliquez sur "Deploy site"

#### 5. Configuration du Domaine

Une fois déployé :
1. Site settings > Domain management
2. Ajoutez votre domaine personnalisé (ex: `pessora.mq`)
3. Configurez les DNS (voir section Configuration DNS)

#### 6. Formulaire de Contact (Optionnel)

Netlify gère automatiquement les formulaires. Dans `Contact.tsx`, ajoutez :

```tsx
<form
  name="contact"
  method="POST"
  data-netlify="true"
  netlify-honeypot="bot-field"
>
  <input type="hidden" name="form-name" value="contact" />
  {/* Vos champs de formulaire */}
</form>
```

---

## Option 2 : Vercel

**Avantages** :
- ✅ Gratuit pour usage personnel
- ✅ Performances excellentes
- ✅ HTTPS automatique
- ✅ Preview deployments
- ✅ Edge Network mondial

### Étapes de Déploiement

#### 1. Créer un Compte Vercel

Allez sur [vercel.com](https://vercel.com/) et créez un compte.

#### 2. Installer Vercel CLI (Optionnel)

```bash
npm install -g vercel
```

#### 3. Déployer

**Méthode A : Via le Dashboard**

1. Cliquez sur "Add New..." > "Project"
2. Importez votre repository GitHub
3. Vercel détecte automatiquement Vite
4. Cliquez sur "Deploy"

**Méthode B : Via CLI**

```bash
cd /chemin/vers/PESSORA
vercel
```

Suivez les instructions interactives.

#### 4. Configuration du Domaine

1. Project Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS

---

## Option 3 : Hébergeur Classique

**Exemples** : o2switch, OVH, Hostinger, Ionos

**Avantages** :
- ✅ Contrôle total
- ✅ Peut combiner avec backend PHP/MySQL
- ✅ Support email inclus

### Étapes de Déploiement

#### 1. Build du Projet

```bash
npm run build
```

Cela crée un dossier `dist/` avec tous les fichiers de production.

#### 2. Créer un fichier `.htaccess`

Dans le dossier `dist/`, créez un fichier `.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirection HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Routing pour Single Page Application
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache des assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

#### 3. Upload via FTP

1. Connectez-vous à votre hébergeur via FTP (FileZilla, Cyberduck, etc.)
2. Uploadez **tout le contenu du dossier `dist/`** (pas le dossier lui-même)
3. Placez les fichiers dans le dossier `public_html/` ou `www/`

#### 4. Vérifier le Déploiement

Visitez votre domaine : `https://pessora.mq`

---

## Configuration DNS

### Pour un Domaine `.mq` ou autre

#### Chez Netlify/Vercel :

1. Récupérez les nameservers fournis (ex: `ns1.netlify.com`)
2. Allez sur votre registrar de domaine (ex: NIC.fr pour .mq)
3. Modifiez les nameservers du domaine

**OU** configurez des enregistrements DNS :

```
Type    Name    Value                      TTL
A       @       104.198.14.52              3600
CNAME   www     votre-site.netlify.app     3600
```

#### Chez un Hébergeur Classique :

Configurez les enregistrements A et CNAME :

```
Type    Name    Value                 TTL
A       @       IP_DE_VOTRE_SERVEUR   3600
CNAME   www     pessora.mq            3600
```

---

## Optimisations Post-Déploiement

### 1. Tester la Performance

Utilisez ces outils pour vérifier les performances :

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

**Objectifs** :
- Score PageSpeed > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s

### 2. Configurer Google Analytics (Optionnel)

Ajoutez Google Analytics dans `index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Configurer un Sitemap

Créez un fichier `public/sitemap.xml` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pessora.mq/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://pessora.mq/concept</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pessora.mq/menu</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://pessora.mq/evenements</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://pessora.mq/contact</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

Puis ajoutez dans `public/robots.txt` :

```
User-agent: *
Allow: /
Sitemap: https://pessora.mq/sitemap.xml
```

### 4. Configurer Open Graph (Partage Social)

Dans `index.html`, ajoutez dans `<head>` :

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://pessora.mq/">
<meta property="og:title" content="PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique">
<meta property="og:description" content="Coffee, shakes, lattes et boissons protéinées pour votre équilibre au quotidien.">
<meta property="og:image" content="https://pessora.mq/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://pessora.mq/">
<meta property="twitter:title" content="PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique">
<meta property="twitter:description" content="Coffee, shakes, lattes et boissons protéinées pour votre équilibre au quotidien.">
<meta property="twitter:image" content="https://pessora.mq/og-image.jpg">
```

---

## 🔒 Sécurité

### Certificat SSL/HTTPS

- **Netlify/Vercel** : Automatique et gratuit (Let's Encrypt)
- **Hébergeur classique** : Activez Let's Encrypt dans votre panel (généralement gratuit)

### Headers de Sécurité

Ajoutez dans `.htaccess` (hébergeur classique) :

```apache
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## 📊 Monitoring

### Uptime Monitoring (Gratuit)

- [UptimeRobot](https://uptimerobot.com/) : Surveille la disponibilité du site
- [Better Uptime](https://betteruptime.com/) : Alternative moderne

### Erreurs JS

- [Sentry](https://sentry.io/) : Tracking des erreurs JavaScript (gratuit jusqu'à 5k événements/mois)

---

## 🆘 Dépannage

### Problème : Page blanche après déploiement

**Solution** : Vérifiez le chemin de base dans `vite.config.ts` :

```typescript
export default defineConfig({
  base: '/', // ou '/pessora/' si déployé dans un sous-dossier
  // ...
})
```

### Problème : Routes ne fonctionnent pas (404)

**Solution** : Assurez-vous que le fichier `.htaccess` est présent et correctement configuré (voir Option 3).

### Problème : Images ne s'affichent pas

**Solution** : Vérifiez les chemins d'images (doivent commencer par `/` depuis `public/`).

---

## ✅ Checklist Post-Déploiement

- [ ] Site accessible via HTTPS
- [ ] Toutes les pages fonctionnent (/, /menu, /contact, etc.)
- [ ] Formulaire de contact fonctionne
- [ ] Google Maps s'affiche correctement
- [ ] Instagram feed intégré
- [ ] Responsive sur mobile, tablette, desktop
- [ ] Score PageSpeed > 85
- [ ] Sitemap.xml accessible
- [ ] Robots.txt configuré
- [ ] Domaine personnalisé configuré
- [ ] Certificat SSL actif
- [ ] Google Analytics configuré (optionnel)

---

**Félicitations ! Votre site PessÓra est en ligne ! 🎉**

Pour toute question : contact@pessora.mq
