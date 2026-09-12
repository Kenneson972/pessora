import type { Event } from '../types/database'

export type PostRegistrationStepId = 'precommande' | 'bilan' | 'objectif'

export function getPostRegistrationSteps(eventType: Event['type']): PostRegistrationStepId[] {
  if (eventType === 'run_club') {
    return ['precommande', 'objectif']
  }
  if (eventType === 'challenge') {
    return ['bilan', 'objectif']
  }
  return ['objectif']
}

// Retrait du 12/09 : les deux formules « boisson + encas » et « boisson + repas léger »
// sont une ancienne formule d'événement, obsolète (décision Ken). Elles vendaient de la
// nourriture alors que les CGV §2 ne listent QUE des boissons — le retrait met le site
// en accord avec son propre contrat. Ne restent que la boisson et « aucune précommande ».
//
// ⚠️ NE PAS confondre avec le RAYON produits `encas` (gamme_products.subcategory,
// « Chips BBQ Onions », « Barre Sport ») : ces produits emballés sont vendus, légitimes,
// et ne sont pas concernés par ce retrait (RangeDetail.tsx, AdminGammes.tsx).
export const PRECOMMANDE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Boisson individuelle', label: 'Boisson individuelle seule' },
  { value: 'Aucune précommande', label: 'Aucune précommande pour l’instant' },
]

export const BILAN_OFFERT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Oui', label: 'Oui, je souhaite profiter du bilan offert' },
  { value: 'Non', label: 'Non merci' },
  { value: 'Deja reserve', label: 'J’ai déjà pris rendez-vous' },
]

export const OBJECTIF_OPTIONS: { value: string; label: string }[] = [
  { value: 'Decouverte', label: 'Découverte / curiosité' },
  { value: 'Remise en forme', label: 'Remise en forme' },
  { value: 'Perte de poids', label: 'Perte de poids' },
  { value: 'Bien-etre social', label: 'Bien-être et lien social' },
  { value: 'Autre', label: 'Autre' },
]

export const STEP_COPY: Record<
  PostRegistrationStepId,
  { title: string; description: string }
> = {
  precommande: {
    title: 'Offre spéciale Run Club',
    description:
      'Réserve ta boisson pour le jour J. Tu pourras ajuster sur place si besoin.',
  },
  bilan: {
    title: 'Bilan bien-être offert',
    description: 'Un court bilan t’est proposé en complément de ta séance. Indique-nous ton choix.',
  },
  objectif: {
    title: 'Ton objectif principal',
    description: 'Ça nous aide à adapter l’accueil et les conseils du jour.',
  },
}
