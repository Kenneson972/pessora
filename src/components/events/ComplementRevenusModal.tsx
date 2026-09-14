import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export interface ComplementRevenusModalProps {
  registrationId: string;
  telephone: string;
  onClose: () => void;
}

// Les deux seules valeurs — la clé dit ce qu'elle veut dire, le libellé pourra changer sans elle
// (docs/CONSIGNES-CLAUDE.md, REVIREMENT DU 12/09, §"Les règles de la section"). Renommées le 14/09
// pour rester le MÊME MOT que ce qui s'affiche à l'écran (la règle qui suit juste après) —
// "savoir_plus_activite_independante" ne correspondait plus au libellé repris de la fiche.
const OPTIONS = [
  {
    value: 'decouvrir_opportunite_herbalife',
    label: "Oui, je souhaite découvrir l'opportunité Herbalife et en savoir plus sur le complément de revenus",
  },
  { value: 'pas_pour_le_moment', label: 'Pas pour le moment' },
];

/**
 * Modal séparé du questionnaire (bilan + objectif) — décision @user du 14/09 : cette question ne
 * vit PAS dans PostRegistrationWizard, elle s'ouvre juste après, décorrélée. Plein écran, avec
 * l'image en haut (retour @user, 14/09) — pas une petite carte.
 *
 * Texte repris MOT POUR MOT de la fiche papier (docs/fiche-papier-challenge-21j.md, section
 * "COMPLÉMENT DE REVENUS") — @user a explicitement retiré la reformulation "activité de
 * distribution indépendante" ajoutée en prévention le 12/09 : c'est SA fiche, pas la nôtre.
 *
 * Règles verrouillées qui restent (docs/CONSIGNES-CLAUDE.md) : AUCUNE promesse de revenus (pas de
 * montant, pas de "gagnez X€" — la fiche elle-même n'en contient aucun), les deux options ont le
 * MÊME poids visuel (jamais un "oui" en bouton sombre face à un "non" pâle), AUCUNE option
 * pré-cochée, et le champ n'est jamais obligatoire (fermer sans répondre = ne rien stocker).
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label="Complément de revenus">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-black/70 backdrop-blur-[2px] transition-colors hover:bg-white sm:right-6 sm:top-6"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <div className="relative h-[42vh] min-h-[220px] w-full sm:h-[48vh]">
        <img src="/challenge-21j/complement-revenus.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="mx-auto max-w-lg px-6 py-8 sm:px-8 sm:py-10">
        <p className="mb-2 text-[10px] font-light uppercase tracking-[0.24em] text-black/45">
          Complément de revenus
        </p>
        <h3
          className="mb-6 font-display font-normal leading-[1.1] text-noir"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 28px)' }}
        >
          Et si Pessóra pouvait aussi t'apporter une opportunité financière ?
        </h3>

        <div className="space-y-2" role="radiogroup" aria-label="Et si Pessóra pouvait aussi t'apporter une opportunité financière ?">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-4 transition-colors ${
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
              <span className="text-[14px] font-light leading-snug text-black/70">{o.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
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
  );
}
