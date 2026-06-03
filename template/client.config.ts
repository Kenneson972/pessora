/**
 * ════════════════════════════════════════════════════════════════════════
 *  KARIBLOOM · TEMPLATE PACK RISE  —  "Le premier rendez-vous automatisé"
 *  Base de référence : PessÓra (Fort-de-France)
 * ════════════════════════════════════════════════════════════════════════
 *
 *  SOURCE DE VÉRITÉ CLIENT — un seul fichier à remplir pour démarrer un
 *  nouveau client RISE (marque/lieu premium avec espace membre, abonnement,
 *  IA de conseil, catalogue éditorial).
 *
 *  ▸ Profil pack RISE : 8-10 pages · IA niveau 3 (conseil & proposition) ·
 *    site d'autorité · espace membre / abonnement · catalogue produits ·
 *    qualification de lead · dashboard.
 *
 *  Stack : React 19 · Vite · TypeScript · HeroUI · Supabase · Tailwind v4.
 *
 *  COMMENT L'UTILISER
 *  1. Dupliquer le repo Pessora → nouveau dossier client.
 *  2. Remplir CLIENT ci-dessous.
 *  3. Reporter NAP dans src/data/infoData.ts (barInfo).
 *  4. Reporter les titres/desc par route dans src/data/seoConfig.ts.
 *  5. Reporter les couleurs dans src/index.css (tokens --color-*).
 *  6. Remplacer le catalogue dans src/data/productsData.ts + menuData.ts.
 *  7. Suivre la checklist complète dans template/TEMPLATE.md.
 *
 *  Valeurs ci-dessous = PessÓra = EXEMPLE de référence. « ⟶ À CHANGER ».
 */

export const CLIENT = {
  /* ─── Identité ─────────────────────────────────────────── */
  brand: 'PessÓra',                       // ⟶ À CHANGER
  legalName: 'PessÓra',                   // ⟶ À CHANGER — raison sociale
  tagline: 'Le 1er Bar Protéiné & Bien-Être de Martinique', // ⟶ À CHANGER
  shortDescription:
    'Bar protéiné à Fort-de-France : shakes, gammes wellness & énergie, coffee bar et accompagnement bien-être.', // ⟶ À CHANGER
  businessType: 'CafeOrCoffeeShop',       // ⟶ À CHANGER — type schema.org

  /* ─── Coordonnées (NAP) ────────────────────────────────── */
  address: {
    street: 'C.C. La Véranda - Cluny',    // ⟶ À CHANGER
    city: 'Fort-de-France',               // ⟶ À CHANGER
    postalCode: '97200',                  // ⟶ À CHANGER
    country: 'Martinique',
    fullAddress: 'C.C. La Véranda – Cluny, 97200 Fort-de-France', // ⟶ À CHANGER
    mapsUrl: 'https://maps.app.goo.gl/VAz5h1cpjWFBq8R59',         // ⟶ À CHANGER
  },
  phone: '+596 696 XX XX XX',             // ⟶ À CHANGER
  email: 'pessora.fr@gmail.com',          // ⟶ À CHANGER

  /* ─── Horaires ─────────────────────────────────────────── */
  hours: {
    weekdays: { days: 'Lundi - Vendredi', hours: '9h30 - 18h' }, // ⟶ À CHANGER
    saturday: { days: 'Samedi', hours: '10h30 - 14h' },          // ⟶ À CHANGER
    sunday: { days: 'Dimanche', hours: 'Fermé' },
  },

  /* ─── Réseaux ──────────────────────────────────────────── */
  socials: {
    instagram: '@pessora.fr',                                    // ⟶ À CHANGER
    instagramUrl: 'https://www.instagram.com/pessora.fr/',       // ⟶ À CHANGER
    facebook: '',
  },

  /* ─── SEO ──────────────────────────────────────────────── */
  seo: {
    baseUrl: 'https://pessora.fr',        // ⟶ À CHANGER
    defaultTitle: 'PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique', // ⟶ À CHANGER
    ogImage: '/logo-pessora.webp',        // ⟶ À CHANGER
    locale: 'fr_FR',
  },

  /* ─── Thème (reporter dans src/index.css :root, tokens --color-*) ─── */
  theme: {
    noir: 'oklch(8% 0.005 55)',           // --color-noir       (texte fort)
    anthracite: 'oklch(17% 0.007 55)',    // --color-anthracite
    ivory: 'oklch(100% 0 0)',             // --color-ivory      (fond)
    gold: 'oklch(75% 0.085 68)',          // --color-gold       (accent) ⟶ À CHANGER
    goldDim: 'oklch(57% 0.065 68)',       // --color-gold-dim            ⟶ À CHANGER
    sapin: '#1E3529',                     // --color-sapin      (éditorial) ⟶ À CHANGER
    heroSurface: 'oklch(11% 0.006 55)',   // --color-surface-hero
  },

  /* ─── Paramètres métier RISE ───────────────────────────── */
  membership: {
    enabled: true,                        // espace membre Supabase
    subscriptionName: 'Óra+',             // ⟶ À CHANGER — nom de l'offre d'abonnement
    surveyEnabled: true,                  // post-registration survey
  },
  chatbot: {
    name: 'PessoBot',                     // ⟶ À CHANGER
    role: 'Expert Nutrition',             // ⟶ À CHANGER — rôle de l'IA conseil
  },
  values: [                               // ⟶ À CHANGER — piliers de marque (page concept)
    { title: 'Équilibre', icon: '⚖️' },
    { title: 'Plaisir', icon: '😊' },
    { title: 'Motivation', icon: '💪' },
    { title: 'Bien-être', icon: '✨' },
  ],
} as const

export type ClientConfig = typeof CLIENT
export default CLIENT
