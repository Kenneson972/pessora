import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface ComplementRevenusModalProps {
  registrationId: string;
  telephone: string;
  onClose: () => void;
}

// Les deux seules valeurs — la clé dit ce qu'elle veut dire, le libellé pourra changer sans elle
// (docs/CONSIGNES-CLAUDE.md, REVIREMENT DU 12/09, §"Les règles de la section"). Renommées le 14/09
// pour rester le MÊME MOT que ce qui s'affiche à l'écran (la règle qui suit juste après).
const OPTIONS = [
  {
    value: 'decouvrir_opportunite_herbalife',
    label: "Oui, je souhaite découvrir l'opportunité Herbalife et en savoir plus sur le complément de revenus",
  },
  { value: 'pas_pour_le_moment', label: 'Pas pour le moment' },
];

/**
 * Modal séparé du questionnaire (bilan + objectif) — décision @user du 14/09 : cette question ne
 * vit PAS dans PostRegistrationWizard, elle s'ouvre juste après, décorrélée.
 *
 * 14/09 (3e retour) : tout le texte se pose EN OVERLAY sur l'image (même traitement que
 * ChallengeHero — voile dégradé + texte blanc par-dessus), pas dans un bloc blanc séparé sous
 * l'image. Gros pop-up, pas plein écran, pas un petit encart centré.
 *
 * Texte repris MOT POUR MOT de la fiche papier (docs/fiche-papier-challenge-21j.md, section
 * "COMPLÉMENT DE REVENUS") — @user a explicitement retiré la reformulation "activité de
 * distribution indépendante" ajoutée en prévention le 12/09 : c'est SA fiche, pas la nôtre.
 *
 * Règles verrouillées qui restent (docs/CONSIGNES-CLAUDE.md) : AUCUNE promesse de revenus (pas de
 * montant, pas de "gagnez X€" — la fiche elle-même n'en contient aucun), les deux options ont le
 * MÊME poids visuel (jamais un "oui" en bouton sombre face à un "non" pâle), AUCUNE option
 * pré-cochée.
 *
 * ⚠️ CHANGEMENT @user (14/09, 4e retour) : la croix de fermeture est retirée — "c'est un choix
 * obligatoire". Ça remplace la règle du 12/09 qui disait l'inverse ("le champ n'est jamais
 * obligatoire"). Ce qui reste vrai malgré ça : "Pas pour le moment" est une réponse à part entière,
 * au même poids que "Oui" — obliger à répondre n'oblige personne à dire oui à l'opportunité elle-
 * même. Aucun autre moyen de fermer (pas de clic sur le voile, pas d'Échap) : il faut choisir une
 * option puis valider.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-noir/70 p-2 py-4 sm:p-4" role="dialog" aria-modal="true" aria-label="Complément de revenus">
      <div className="relative w-full max-w-[96vw] overflow-hidden rounded-[2px] shadow-2xl lg:max-w-6xl">
        <img src="/challenge-21j/complement-revenus.webp" alt="" className="h-auto w-full" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(7% .004 55 / 0.35) 0%, oklch(7% .004 55 / 0.6) 45%, oklch(7% .004 55 / 0.95) 100%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.24em] text-white">
            Complément de revenus
          </p>
          <h3
            className="mb-6 max-w-2xl font-display font-normal leading-[1.1] text-white"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3.2vw, 34px)' }}
          >
            Et si Pessóra pouvait aussi t'apporter une opportunité financière ?
          </h3>

          <div className="max-w-2xl space-y-2" role="radiogroup" aria-label="Et si Pessóra pouvait aussi t'apporter une opportunité financière ?">
            {OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3 rounded-[2px] border p-3.5 backdrop-blur-[2px] transition-colors sm:p-4 ${
                  selected === o.value ? 'border-white/50 bg-white/15' : 'border-white/20 bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="complement_revenus"
                  value={o.value}
                  checked={selected === o.value}
                  onChange={() => setSelected(o.value)}
                  className="mt-0.5 accent-white"
                />
                <span className="text-[13px] font-light leading-snug text-white sm:text-[14px]">{o.label}</span>
              </label>
            ))}
          </div>

          {error && <p className="mt-3 text-[11px] text-red-200">{error}</p>}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={!selected || submitting}
              className="rounded-full bg-white px-6 py-3 text-[10px] font-normal uppercase tracking-[0.12em] text-noir hover:bg-white/90 disabled:opacity-40"
            >
              {submitting ? 'Envoi…' : 'Valider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
