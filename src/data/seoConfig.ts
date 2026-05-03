/**
 * Config SEO par route : titre et description pour le document et les meta.
 * Utilisé par le composant PageSEO (titres dynamiques par page).
 */
export interface PageSEOEntry {
  title: string;
  description: string;
}

/** Chemin exact ou préfixe -> { title, description }. Les routes plus spécifiques doivent être avant les préfixes. */
export const seoConfig: Record<string, PageSEOEntry> = {
  '/': {
    title: 'PessÓra - Le 1er Bar Protéiné & Bien-Être de Martinique',
    description:
      'Shakes protéinés, wellness, énergie et coffee bar à Fort-de-France. Le 1er bar protéiné & bien-être de Martinique.',
  },
  '/concept': {
    title: 'Notre Concept | PessÓra - Équilibre & Bien-être',
    description: 'Découvrez la philosophie PessÓra : équilibre, plaisir et motivation. Le 1er bar protéiné de Martinique.',
  },
  '/menu': {
    title: 'Menu | PessÓra - Boissons Wellness, Énergie & Shakes',
    description: 'Consultez notre menu : gamme Wellness, Énergie Drink, Shakes protéinés et Coffee. Prix et ingrédients.',
  },
  '/nos-produits': {
    title: 'Nos Produits | PessÓra - Gammes & Boissons',
    description:
      'Gammes complémentaires Wellness, Sport et Skin : nutrition et soins avec PessÓra à Fort-de-France.',
  },
  '/contact-partenariat': {
    title: 'Partenariats | PessÓra - Propositions marques & événements',
    description:
      'Contact dédié aux marques, organisateurs et médias : pop-ups, sponsoring, collaborations avec le bar protéiné PessÓra à Fort-de-France.',
  },
  '/contact': {
    title: 'Contact | PessÓra - Nous trouver à Fort-de-France',
    description: 'Adresse, horaires et contact. PessÓra - C.C. La Véranda Cluny, 97200 Fort-de-France, Martinique.',
  },
  '/evenements': {
    title: 'Événements & Pop-ups | PessÓra',
    description: 'Retrouvez PessÓra en pop-up et lors d\'événements. Partenariats GigaFit, En Bons Thermes.',
  },
  '/pessobot': {
    title: 'PessoBot | Expert Nutrition PessÓra',
    description: 'Posez vos questions au bot nutrition PessÓra. Conseils boissons, horaires, menu et bien-être.',
  },
  '/ora-plus': {
    title: 'Óra+ | Abonnement PessÓra',
    description:
      'Abonnement premium PessÓra : remises sur les boissons, bilan bien-être, événements prioritaires. Sans engagement.',
  },
  '/connexion': {
    title: 'Connexion | Club PessÓra',
    description: 'Connectez-vous à votre espace membre PessÓra pour accéder à vos avantages.',
  },
  '/inscription': {
    title: 'Inscription | Club PessÓra',
    description: 'Créez votre compte et rejoignez le Club PessÓra.',
  },
  '/mentions-legales': {
    title: 'Mentions légales | PessÓra',
    description: 'Mentions légales et informations sur l\'éditeur du site PessÓra.',
  },
  '/politique-confidentialite': {
    title: 'Politique de confidentialité | PessÓra',
    description:
      'RGPD : données collectées, cookies, droits d’accès et de suppression — politique de confidentialité PessÓra.',
  },
  '/cgv': {
    title: 'CGV | PessÓra',
    description: 'Conditions générales de vente PessÓra.',
  },
  '/mockup-luxe': {
    title: 'Maquette luxe (interne) | PessÓra',
    description: 'Prévisualisation design minimaliste luxe — usage interne, non destinée au référencement.',
  },
  '/mon-espace': {
    title: 'Mon espace | Club PessÓra',
    description: 'Espace membre PessÓra : profil, abonnement et historique.',
  },
  '/demo-espace': {
    title: 'Démonstration espace membre | PessÓra',
    description: 'Découvrez l\'espace membre PessÓra en démonstration.',
  },
};

/** Retourne l’entrée SEO pour un pathname (match exact, sinon préfixe le plus long). */
export function getSEOForPath(pathname: string): PageSEOEntry | null {
  if (seoConfig[pathname]) return seoConfig[pathname];
  const sorted = Object.keys(seoConfig)
    .filter((path) => path !== '/' && pathname.startsWith(path))
    .sort((a, b) => b.length - a.length);
  const key = sorted[0];
  return key ? seoConfig[key] : null;
}
