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
 * Codes posés par fn_create_bilan_booking_from_registration (RPC
 * questionnaire, migration 20260911140000) — contexte 'questionnaire' :
 *   P0004 = l'événement de l'inscription n'est pas de type 'challenge'.
 *   Choix délibéré de NE PAS réutiliser P0001 ici : cette RPC appelle aussi
 *   fn_save_post_registration_survey côté caller, qui utilise déjà P0001
 *   pour un vocabulaire d'erreurs totalement différent (registration_not_found,
 *   already_completed, etc.) — réutiliser P0001 aurait fait retomber ce
 *   contexte sur le message "trop de demandes", trompeur.
 *
 * error.message n'est JAMAIS affiché — seulement inspecté en interne pour
 * distinguer les deux causes possibles d'un 23505 (nom de la contrainte
 * violée), jamais exposé à l'utilisateur.
 */
export type BilanErrorContext = 'slot' | 'hors-date' | 'questionnaire';

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
    case 'P0004':
      return 'Le bilan offert n’est disponible que pour le Challenge 21 jours.';
    default:
      return 'Une erreur est survenue. Réessaie ou contacte-nous.';
  }
}
