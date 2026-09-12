import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Label,
  Radio,
  RadioGroup,
  Spinner,
  TextArea,
  TextField,
  cn,
} from '@heroui/react'
import { supabase } from '../../lib/supabaseClient'
import { mapBilanError } from '../../lib/bilanErrors'
import {
  parsePostRegistrationPayload,
  toSurveyJsonPayload,
} from '../../lib/postRegistrationSurveySchema'
import {
  BILAN_OFFERT_OPTIONS,
  getPostRegistrationSteps,
  OBJECTIF_OPTIONS,
  PRECOMMANDE_OPTIONS,
  STEP_COPY,
  type PostRegistrationStepId,
} from '../../data/postRegistrationSurvey'
import type { Event } from '../../types/database'

export type PostRegistrationWizardProps = {
  registrationId: string
  telephone: string
  eventType: Event['type']
  /** Affichage contextuel (titre optionnel). */
  eventTitle: string
  onComplete?: () => void
}

type Fields = {
  precommande_offre: string
  bilan_offert: string
  objectif_principal: string
  objectif_autre: string
}

const emptyFields = (): Fields => ({
  precommande_offre: '',
  bilan_offert: '',
  objectif_principal: '',
  objectif_autre: '',
})

const radioListClass = 'flex flex-col gap-3'

const radioItemClass = cn(
  'flex cursor-pointer items-start gap-3 rounded-[2px] border border-noir/[0.08] p-3 transition-colors',
  'data-[selected=true]:border-noir/25 data-[selected=true]:bg-noir/[0.02]',
)

function mapRpcErrorMessage(raw: string): string {
  if (raw.includes('already_completed')) {
    return 'Ce questionnaire a déjà été enregistré pour cette inscription.'
  }
  if (raw.includes('telephone_mismatch')) {
    return 'Le numéro ne correspond pas à l’inscription. Recharge la page et réessaie.'
  }
  if (raw.includes('registration_not_found')) {
    return 'Inscription introuvable. Recharge la page ou contacte-nous.'
  }
  if (raw.includes('invalid_payload_keys')) {
    return 'Données non valides pour ce type d’événement.'
  }
  return 'Impossible d’enregistrer tes réponses pour le moment. Réessaie ou écris-nous sur Instagram.'
}

function validateStep(step: PostRegistrationStepId, f: Fields): string | null {
  switch (step) {
    case 'precommande':
      return f.precommande_offre.trim() ? null : 'Choisis une option.'
    case 'bilan':
      return f.bilan_offert.trim() ? null : 'Choisis une réponse.'
    case 'objectif': {
      if (!f.objectif_principal.trim()) return 'Choisis un objectif.'
      if (f.objectif_principal === 'Autre' && !f.objectif_autre.trim()) {
        return 'Précise ton objectif.'
      }
      return null
    }
    default:
      return null
  }
}

export function PostRegistrationWizard({
  registrationId,
  telephone,
  eventType,
  eventTitle,
  onComplete,
}: PostRegistrationWizardProps) {
  const steps = useMemo(() => getPostRegistrationSteps(eventType), [eventType])
  const [stepIndex, setStepIndex] = useState(0)
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const currentStep = steps[stepIndex] ?? steps[0]
  const stepMeta = STEP_COPY[currentStep]
  const total = steps.length
  const isLast = stepIndex >= total - 1

  const goNext = () => {
    setStepError(null)
    const err = validateStep(currentStep, fields)
    if (err) {
      setStepError(err)
      return
    }
    if (isLast) {
      void submitFinal()
      return
    }
    setStepIndex((i) => Math.min(i + 1, total - 1))
  }

  const goBack = () => {
    setStepError(null)
    setSubmitError(null)
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const submitFinal = async () => {
    setSubmitError(null)
    setStepError(null)

    const raw: Record<string, unknown> = {
      bilan_offert: fields.bilan_offert,
      objectif_principal: fields.objectif_principal,
      objectif_autre: fields.objectif_autre.trim() || undefined,
    }
    if (eventType === 'run_club') {
      raw.precommande_offre = fields.precommande_offre
    }

    const parsed = parsePostRegistrationPayload(eventType, raw)
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg =
        Object.values(first)
          .flat()
          .find(Boolean) ?? 'Merci de vérifier les champs.'
      setStepError(msg)
      return
    }

    const payload = toSurveyJsonPayload(parsed.data)

    setSubmitting(true)
    const { error } = await supabase.rpc('fn_save_post_registration_survey', {
      p_registration_id: registrationId,
      p_telephone: telephone,
      p_payload: payload,
    })

    if (error) {
      setSubmitting(false)
      setSubmitError(mapRpcErrorMessage(error.message ?? ''))
      return
    }

    if (eventType === 'challenge' && fields.bilan_offert === 'Oui') {
      const { error: bilanError } = await supabase.rpc('fn_create_bilan_booking_from_registration', {
        p_registration_id: registrationId,
        p_telephone: telephone,
      })
      setSubmitting(false)

      if (bilanError) {
        setSubmitError(mapBilanError(bilanError, 'questionnaire'))
        return
      }
    } else {
      setSubmitting(false)
    }

    setDone(true)
    onComplete?.()
  }

  if (done) {
    return (
      <div
        className="mt-8 rounded-[2px] border border-noir/[0.08] bg-neutral-cream/40 p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-editorial-section-title text-[10px] uppercase tracking-[0.2em] text-black/45">
          Merci
        </p>
        <p className="mt-2 text-[13px] font-light leading-relaxed text-black/65">
          Tes réponses pour <span className="font-normal text-noir">{eventTitle}</span> sont enregistrées.
        </p>
      </div>
    )
  }

  const renderOptions = (options: { value: string; label: string }[], field: keyof Fields) => (
    <RadioGroup
      aria-label={STEP_COPY[currentStep]?.title ?? 'Choix'}
      value={fields[field]}
      onChange={(v) => setFields((prev) => ({ ...prev, [field]: v as string }))}
      className={radioListClass}
    >
      {options.map((o) => (
        <Radio key={o.value} value={o.value} className={radioItemClass}>
          <Radio.Control className="mt-0.5">
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content className="text-left text-[13px] font-light leading-snug text-black/70">
            {o.label}
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  )

  return (
    <Card className="mt-8 overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-none">
      <Card.Header className="border-b border-noir/[0.06] px-5 py-4 sm:px-6">
        <p className="text-editorial-section-title text-[10px] uppercase tracking-[0.2em] text-black/40">
          Questionnaire rapide
        </p>
        <Card.Title className="mt-1 font-display font-light text-noir" style={{ fontSize: '20px' }}>
          {stepMeta.title}
        </Card.Title>
        <Card.Description className="mt-2 text-[12px] font-light leading-relaxed text-black/50">
          {stepMeta.description}
        </Card.Description>
        <p className="mt-3 text-[10px] font-normal uppercase tracking-[0.18em] text-black/35">
          Étape {stepIndex + 1} / {total}
        </p>
      </Card.Header>
      <Card.Content className="space-y-5 px-5 py-5 sm:px-6">
        {currentStep === 'precommande' && renderOptions(PRECOMMANDE_OPTIONS, 'precommande_offre')}

        {currentStep === 'bilan' && renderOptions(BILAN_OFFERT_OPTIONS, 'bilan_offert')}

        {currentStep === 'objectif' && (
          <div className="space-y-4">
            {renderOptions(OBJECTIF_OPTIONS, 'objectif_principal')}
            {fields.objectif_principal === 'Autre' && (
              <TextField
                value={fields.objectif_autre}
                onChange={(v) => setFields((prev) => ({ ...prev, objectif_autre: v }))}
                className="space-y-2"
              >
                <Label className="text-[10px] font-normal uppercase tracking-[0.14em] text-black/40">
                  Précise ton objectif
                </Label>
                <TextArea
                  rows={2}
                  placeholder="Ex. retrouver de l’énergie au travail…"
                  variant="secondary"
                  className={cn(
                    'w-full resize-none border-0 border-b border-noir/10 bg-transparent py-3 text-[14px] font-light text-noir',
                    'focus-visible:border-noir',
                  )}
                />
              </TextField>
            )}
          </div>
        )}

        {stepError && (
          <p className="text-[11px] text-red-600" role="alert">
            {stepError}
          </p>
        )}
        {submitError && (
          <p className="text-[11px] text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onPress={goBack}
            isDisabled={stepIndex === 0 || submitting}
            className="min-h-11 rounded-full border border-noir/10 px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-black/50"
          >
            Retour
          </Button>
          <Button
            type="button"
            variant="primary"
            onPress={goNext}
            isDisabled={submitting}
            className="min-h-11 rounded-full bg-noir px-8 text-[10px] font-normal uppercase tracking-[0.12em] text-white"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" color="current" className="text-white" />
                Envoi…
              </span>
            ) : isLast ? (
              'Valider'
            ) : (
              'Suivant'
            )}
          </Button>
        </div>
      </Card.Content>
    </Card>
  )
}
