import type { Event } from '../types/database'

export type PostRegistrationStepId = 'precommande' | 'bilan' | 'objectif' | 'gaufres'

export function getPostRegistrationSteps(eventType: Event['type']): PostRegistrationStepId[] {
  if (eventType === 'run_club') {
    return ['precommande', 'bilan', 'objectif', 'gaufres']
  }
  return ['bilan', 'objectif']
}

export const PRECOMMANDE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Formule 18 €', label: 'Formule 18 € (boisson + encas)' },
  { value: 'Formule 28 €', label: 'Formule 28 € (boisson + repas léger)' },
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

export const GAUFRE_SALEE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Jambon fromage', label: 'Classique jambon-fromage' },
  { value: 'Vegetarienne', label: 'Végétarienne' },
  { value: 'Autre', label: 'Autre' },
]

export const STEP_COPY: Record<
  PostRegistrationStepId,
  { title: string; description: string }
> = {
  precommande: {
    title: 'Offre spéciale Run Club',
    description:
      'Profite des formules préférentielles pour le jour J. Tu pourras ajuster sur place si besoin.',
  },
  bilan: {
    title: 'Bilan bien-être offert',
    description: 'Un court bilan t’est proposé en complément de ta séance. Indique-nous ton choix.',
  },
  objectif: {
    title: 'Ton objectif principal',
    description: 'Ça nous aide à adapter l’accueil et les conseils du jour.',
  },
  gaufres: {
    title: 'Gaufres & douceurs',
    description:
      'Après l’effort : gaufre salée au choix, et une note pour ta gaufre sucrée ou ton shake (voir carte sur place).',
  },
}
