import { z } from 'zod'

const objectifRefine = (data: { objectif_principal: string; objectif_autre?: string }, ctx: z.RefinementCtx) => {
  if (data.objectif_principal === 'Autre' && !String(data.objectif_autre ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['objectif_autre'],
      message: 'Précise ton objectif.',
    })
  }
}

export const postRegistrationBaseSchema = z
  .object({
    // Optionnel hors challenge : le bilan offert n'existe que pour ce type
    // d'événement (widget monté uniquement sur type='challenge').
    bilan_offert: z.string().optional(),
    objectif_principal: z.string().min(1, 'Choisis un objectif.'),
    objectif_autre: z.string().optional(),
  })
  .superRefine(objectifRefine)

export const postRegistrationChallengeSchema = z
  .object({
    bilan_offert: z.string().min(1, 'Choisis une réponse.'),
    objectif_principal: z.string().min(1, 'Choisis un objectif.'),
    objectif_autre: z.string().optional(),
  })
  .superRefine(objectifRefine)

export const postRegistrationRunClubSchema = z
  .object({
    // Neutralisé (retrait du parcours Bilan public, 10/09) — voir schéma ci-dessus.
    bilan_offert: z.string().optional(),
    objectif_principal: z.string().min(1, 'Choisis un objectif.'),
    objectif_autre: z.string().optional(),
  })
  .superRefine(objectifRefine)

export type PostRegistrationBasePayload = z.infer<typeof postRegistrationBaseSchema>
export type PostRegistrationRunClubPayload = z.infer<typeof postRegistrationRunClubSchema>
export type PostRegistrationChallengePayload = z.infer<typeof postRegistrationChallengeSchema>

export function parsePostRegistrationPayload(
  eventType: string,
  raw: Record<string, unknown>,
): z.SafeParseReturnType<
  PostRegistrationBasePayload | PostRegistrationRunClubPayload | PostRegistrationChallengePayload,
  PostRegistrationBasePayload | PostRegistrationRunClubPayload | PostRegistrationChallengePayload
> {
  if (eventType === 'run_club') {
    return postRegistrationRunClubSchema.safeParse(raw)
  }
  if (eventType === 'challenge') {
    return postRegistrationChallengeSchema.safeParse(raw)
  }
  return postRegistrationBaseSchema.safeParse(raw)
}

/** Objet JSON envoyé au RPC (chaînes uniquement, optionnels omis si vides). */
export function toSurveyJsonPayload(
  parsed: PostRegistrationBasePayload | PostRegistrationRunClubPayload,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed)) {
    if (v === undefined || v === null) continue
    const s = String(v).trim()
    if (s === '') continue
    out[k] = s
  }
  return out
}
