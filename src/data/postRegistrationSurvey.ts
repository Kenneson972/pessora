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

// Cette étape n'existe QUE pour le type 'challenge' (getPostRegistrationSteps) — et le bilan y est
// OBLIGATOIRE (CLAUDE.md, décision du 10/09 : « inscription au bilan obligatoire pour participer »).
// ⚠️ Pas d'option « Non merci » : ça contredirait le widget de réservation juste au-dessus, qui est
// toujours affiché et jamais skippable. Les deux options ne décrivent que QUAND le rdv est pris.
export const BILAN_OFFERT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Oui', label: 'Oui, je viens de réserver mon créneau' },
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
    title: 'Bilan bien-être',
    description: 'Le bilan est obligatoire pour participer au challenge — confirme que ton créneau est pris.',
  },
  objectif: {
    title: 'Ton objectif principal',
    description: 'Ça nous aide à adapter l’accueil et les conseils du jour.',
  },
}
