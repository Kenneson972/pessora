import type { Event } from '../types/database'

export type PostRegistrationStepId = 'bilan' | 'objectif'

export function getPostRegistrationSteps(eventType: Event['type']): PostRegistrationStepId[] {
  if (eventType === 'run_club') {
    return ['objectif']
  }
  if (eventType === 'challenge') {
    return ['bilan', 'objectif']
  }
  return ['objectif']
}

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
  bilan: {
    title: 'Bilan bien-être offert',
    description: 'Un court bilan t’est proposé en complément de ta séance. Indique-nous ton choix.',
  },
  objectif: {
    title: 'Ton objectif principal',
    description: 'Ça nous aide à adapter l’accueil et les conseils du jour.',
  },
}
