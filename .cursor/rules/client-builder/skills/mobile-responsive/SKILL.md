---
name: mobile-responsive
description: >
  Audit et implémentation responsive mobile Karibloom : viewport, mobile-first, touch 44px,
  safe areas, svh/dvh, overflow horizontal, formulaires (clavier), pièges Chrome Android
  (backdrop-filter, background-attachment fixed, WebP/WebGL), checklist avant livraison.
  Utiliser pour « mobile », « responsive », « cassé sur téléphone », « hamburger », breakpoints.
---

# Skill — Mobile responsive (Karibloom)

## Objectif

Aligner le front (Next.js App Router ou React SPA) sur les exigences **mobile-first**, **accessibilité tactile** et **perf Chrome Android**, sans casser le desktop.

## Ordre de travail recommandé

1. Lire le **résumé** dans la règle pack `client-builder/03-architecture/kb-mobile-responsive.mdc` (redirecteur).
2. Ouvrir `references/full-mobile-guide.md` pour le détail (viewport, images, CWV, section 8 Chrome Android, checklist copier-coller).
3. Sur un projet Next.js : vérifier `app/layout.tsx` → `export const viewport` (width device, `viewportFit: 'cover'` si besoin safe area).
4. Auditer : `html/body` overflow-x, `min-h-screen` vs `min-h-[100svh]` sur heros, `backdrop-blur` sur header, `100vh` dans les `calc`, largeurs fixes (`w-[450px]`) sur petits écrans.
5. Corriger par **petits lots** (un fichier ou une zone à la fois pour les perfs).

## Fichiers du skill

| Fichier | Contenu |
|---------|---------|
| `references/full-mobile-guide.md` | Guide complet + checklist §8 Chrome Android |
| Règle racine projet (optionnel) | `.cursor/rules/kb-mobile-responsive.mdc` — même guide avec globs si chargement auto |

## Scripts (optionnel)

Pour un audit automatisé multi-viewports, tu peux ajouter plus tard un script Puppeteer/Playwright dans `scripts/audit-mobile.js` (non requis pour l’usage manuel du skill).

## Ce que ce skill ne fait pas

- Ne remplace pas les tests sur **appareil réel** (3G, barre d’adresse, notch).
- Ne dispense pas de vérifier **Formulaires** (`kb-forms`) et **SEO** sur les pages publiques.
