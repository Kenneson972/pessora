/**
 * Mapping unique des erreurs bilan_bookings — partagé entre
 * BilanBookingWidget.tsx et (plus tard) la RPC du questionnaire
 * post-inscription. Une seule liste blanche de messages : jamais
 * error.message ni error.details affichés tels quels (details contient
 * le numéro de téléphone normalisé sur une violation 23505 de dédup —
 * c'est une donnée personnelle, jamais montrée à l'utilisateur).
 *
 * Codes posés par la migration 20260911100000 :
 *   23505 = créneau déjà pris (index bilan_bookings_slot_unique_active)
 *           OU demande déjà en attente en cas de vraie course concurrente
 *           sur le chemin hors-créneau (rare — le pré-check P0002 couvre
 *           le cas non-concurrent, l'index est le filet de sécurité) ;
 *   P0001 = trop de demandes (rate-limit) ;
 *   P0002 = demande déjà en attente (pré-vérifiée, cas non-concurrent) ;
 *   P0003 = numéro de téléphone invalide.
 *
 * error.message n'est JAMAIS affiché — seulement inspecté en interne pour
 * distinguer les deux causes possibles d'un 23505 (nom de la contrainte
 * violée), jamais exposé à l'utilisateur.
 */
export type BilanErrorContext = 'slot' | 'hors-date';

interface SupabaseLikeError {
  code?: string;
  message?: string;
}

export function mapBilanError(error: SupabaseLikeError | null, context: BilanErrorContext): string {
  if (!error) return 'Une erreur est survenue. Réessaie ou contacte-nous.';

  if (error.code === '23505') {
    if (error.message?.includes('bilan_bookings_slot_unique_active')) {
      return 'Ce créneau vient d’être pris — actualise la page.';
    }
    if (error.message?.includes('bilan_bookings_hors_date_dedup')) {
      return 'Tu as déjà une demande en attente.';
    }
    // Nom de contrainte non reconnu (ex. message API tronqué) : on retombe
    // sur le message cohérent avec le chemin emprunté plutôt que d'exposer
    // le message brut.
    return context === 'slot'
      ? 'Ce créneau vient d’être pris — actualise la page.'
      : 'Tu as déjà une demande en attente.';
  }

  switch (error.code) {
    case 'P0001':
      return 'Trop de demandes récentes — réessaie demain ou contacte-nous directement.';
    case 'P0002':
      return 'Tu as déjà une demande en attente.';
    case 'P0003':
      return 'Vérifie ton numéro de téléphone.';
    default:
      return 'Une erreur est survenue. Réessaie ou contacte-nous.';
  }
}
