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

const gaufreRefine = (data: { gaufre_salee: string; gaufre_salee_autre?: string }, ctx: z.RefinementCtx) => {
  if (data.gaufre_salee === 'Autre' && !String(data.gaufre_salee_autre ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['gaufre_salee_autre'],
      message: 'Indique quelle gaufre salée tu souhaites.',
    })
  }
}

export const postRegistrationBaseSchema = z
  .object({
    bilan_offert: z.string().min(1, 'Choisis une réponse.'),
    objectif_principal: z.string().min(1, 'Choisis un objectif.'),
    objectif_autre: z.string().optional(),
  })
  .superRefine(objectifRefine)

export const postRegistrationRunClubSchema = z
  .object({
    precommande_offre: z.string().min(1, 'Choisis une offre.'),
    bilan_offert: z.string().min(1, 'Choisis une réponse.'),
    objectif_principal: z.string().min(1, 'Choisis un objectif.'),
    objectif_autre: z.string().optional(),
    gaufre_salee: z.string().min(1, 'Choisis une gaufre salée.'),
    gaufre_salee_autre: z.string().optional(),
    gaufre_sucree_notes: z.string().optional(),
  })
  .superRefine(objectifRefine)
  .superRefine(gaufreRefine)

export type PostRegistrationBasePayload = z.infer<typeof postRegistrationBaseSchema>
export type PostRegistrationRunClubPayload = z.infer<typeof postRegistrationRunClubSchema>

export function parsePostRegistrationPayload(
  eventType: string,
  raw: Record<string, unknown>,
): z.SafeParseReturnType<PostRegistrationBasePayload | PostRegistrationRunClubPayload, PostRegistrationBasePayload | PostRegistrationRunClubPayload> {
  if (eventType === 'run_club') {
    return postRegistrationRunClubSchema.safeParse(raw)
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
