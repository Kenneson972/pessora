/**
 * Types de campagne newsletter — union TS, pas de CHECK fermé en base (même arbitrage
 * que newsletterSources.ts) : `newsletter_campaigns.type` reste `text`, cette liste vit
 * uniquement côté écran (sélecteur + gabarits de départ).
 */
export const NEWSLETTER_TYPES = ['promo', 'challenge', 'evenement', 'info'] as const;
export type NewsletterType = (typeof NEWSLETTER_TYPES)[number];

export const NEWSLETTER_TYPE_LABELS: Record<NewsletterType, string> = {
  promo: 'Promo / Nouveau produit',
  challenge: 'Challenge 21j',
  evenement: 'Événement',
  info: 'Info générale',
};

/**
 * Brouillons de départ — copie NEUVE destinée aux clientes de Catherine, marquée comme
 * telle dans l'admin (« brouillon — à personnaliser »). L'admin peut tout réécrire ;
 * ces textes ne partent jamais tels quels sans relecture. Validation Ken/Catherine à
 * faire séparément (spec §9, question ouverte) — retirer la fonction n'était pas la
 * bonne réponse à « ce texte n'est pas encore validé ».
 */
export const NEWSLETTER_TYPE_DRAFTS: Record<NewsletterType, { subject: string; body: string }> = {
  promo: {
    subject: 'Nouveau à la carte',
    body: '',
  },
  challenge: {
    subject: 'Le prochain Challenge 21 jours ouvre bientôt',
    body: '',
  },
  evenement: {
    subject: 'On vous attend au bar !',
    body: '',
  },
  info: {
    subject: '',
    body: '',
  },
};
