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

/**
 * Les 4 objectifs de la fiche papier de Catherine (docs/fiche-papier-challenge-21j.md),
 * décision @user du 14/09 : ils REMPLACENT OBJECTIF_OPTIONS, mais SEULEMENT pour le
 * type 'challenge' — OBJECTIF_OPTIONS reste inchangé pour les 6 autres types d'événement.
 * On stocke la CLÉ, jamais le libellé (docs/CONSIGNES-CLAUDE.md:153) : le libellé changera
 * encore, la clé non. Choix UNIQUE (radio) : la fiche dit « Mon objectif », au singulier.
 */
export const CHALLENGE_OBJECTIF_OPTIONS: { value: string; label: string }[] = [
  { value: 'perte_de_poids', label: 'Perte de poids' },
  { value: 'prise_de_masse', label: 'Prise de masse / tonification' },
  { value: 'plus_energie', label: 'Plus d’énergie' },
  { value: 'bonnes_habitudes', label: 'Reprendre de bonnes habitudes' },
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
