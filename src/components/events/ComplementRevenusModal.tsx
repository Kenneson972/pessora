import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface ComplementRevenusModalProps {
  registrationId: string;
  telephone: string;
  onClose: () => void;
}

// Les deux seules valeurs — la clé dit ce qu'elle veut dire, le libellé pourra changer sans elle
// (docs/CONSIGNES-CLAUDE.md, REVIREMENT DU 12/09, §"Les règles de la section").
const OPTIONS = [
  {
    value: 'savoir_plus_activite_independante',
    label: "Oui, je souhaite en savoir plus sur l'activité de distribution indépendante.",
  },
  { value: 'pas_maintenant', label: 'Pas pour le moment.' },
];

/**
 * Modal séparé du questionnaire (bilan + objectif) — décision @user du 14/09 : cette question ne
 * vit PAS dans PostRegistrationWizard, elle s'ouvre juste après, décorrélée.
 *
 * Règles verrouillées (docs/CONSIGNES-CLAUDE.md) : AUCUNE promesse de revenus (pas de montant, pas
 * de "gagnez X€"), les deux options ont le MÊME poids visuel (jamais un "oui" en bouton sombre
 * face à un "non" pâle — le consentement doit rester libre), AUCUNE option pré-cochée, et le champ
 * n'est jamais obligatoire pour participer au challenge (fermer sans répondre = ne rien stocker).
 */
export function ComplementRevenusModal({ registrationId, telephone, onClose }: ComplementRevenusModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.rpc('fn_save_complement_revenus', {
      p_registration_id: registrationId,
      p_telephone: telephone,
      p_complement_revenus: selected,
    });
    setSubmitting(false);
    if (err) {
      setError('Impossible d’enregistrer ta réponse. Réessaie ou ferme cette fenêtre.');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/40 p-4" role="dialog" aria-modal="true" aria-label="Complément de revenus">
      <div className="w-full max-w-lg overflow-hidden rounded-[2px] bg-white shadow-lg">
        {/* Image — remplaçable depuis /admin plus tard si besoin ; posée en dur pour tester (@user, 14/09). */}
        <div className="relative aspect-[21/9] w-full bg-surface-muted">
          <img src="/challenge-21j/complement-revenus.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-black/70 backdrop-blur-[2px] transition-colors hover:bg-white"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 sm:p-8">
        <h3 className="mb-5 font-display font-normal text-noir" style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
          Envie d'en savoir plus ?
        </h3>

        <p className="mb-5 text-[13px] font-light leading-relaxed text-black/60">
          Et si Pessóra pouvait aussi t'apporter une opportunité financière ? Il s'agit d'une{' '}
          <strong className="font-normal text-black/70">activité de distribution indépendante</strong> —
          ni un emploi, ni un salaire.
        </p>

        <div className="space-y-2" role="radiogroup" aria-label="Envie d'en savoir plus ?">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-3 transition-colors ${
                selected === o.value ? 'border-noir/25 bg-noir/[0.02]' : 'border-noir/[0.08]'
              }`}
            >
              <input
                type="radio"
                name="complement_revenus"
                value={o.value}
                checked={selected === o.value}
                onChange={() => setSelected(o.value)}
                className="mt-0.5 accent-sapin"
              />
              <span className="text-[13px] font-light leading-snug text-black/70">{o.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="text-[11px] font-light text-black/45 hover:text-noir">
            Fermer sans répondre
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!selected || submitting}
            className="rounded-full bg-noir px-6 py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite disabled:opacity-40"
          >
            {submitting ? 'Envoi…' : 'Valider'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
