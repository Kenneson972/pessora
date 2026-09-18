/**
 * Origines d'inscription newsletter — **le seul lieu d'édition du vocabulaire**.
 *
 * Côté ÉCRITURE : `NewsletterSource` est l'union fermée des surfaces réelles.
 * Une faute de frappe dans un littéral ne compile pas (réserve de @vela, arbitrée
 * par @alcyone) — c'est une garde de frappe, elle ne remplace PAS le prédicat
 * d'exclusion de la base (`lower(source) LIKE 'test-%'`), qui reste le seul tri
 * côté envoi. Elle ne referme pas la liste : une surface neuve entre par un ajout
 * délibéré ici, jamais par un slug écrit de travers.
 *
 * Côté LECTURE : ce même type sert à la résolution littéral → mots de l'admin
 * (correspondance exacte, puis famille par préfixe, puis repli explicite —
 * jamais un slug affiché à Catherine).
 *
 * Une surface de test reste HORS de cette liste : préfixe `test-` réservé,
 * exclu par la vue. Les 6 littéraux ci-dessous sont ceux mesurés dans
 * `origin/main` au 16/09/2026.
 */
export const NEWSLETTER_SOURCES = [
  'footer',
  'challenge-closed',
  'challenge-ended',
  'challenge-outside-window',
  'challenge-full',
  'challenge-not-yet-created',
] as const;

export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];
