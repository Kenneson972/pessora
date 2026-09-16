import { useState } from 'react';
import { Sheet } from '@heroui-pro/react';
import { Trash2 } from 'lucide-react';
import { formatSurveyDetails } from '../../lib/challengeRegistrantDetails';
import { ConfirmDialog } from '../dashboard/ConfirmDialog';
import type { ChallengeRegistrantRow } from '../../hooks/useAdminChallengeRegistrants';

export interface ChallengeRegistrantDetailModalProps {
  registrant: ChallengeRegistrantRow | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const rowClass = 'flex items-baseline justify-between gap-4 border-b border-noir/[0.05] py-2.5 last:border-0';
const labelClass = 'text-[10px] uppercase tracking-[0.14em] text-black/40';
const valueClass = 'text-[12px] text-black text-right';

export function ChallengeRegistrantDetailModal({ registrant, onClose, onDelete }: ChallengeRegistrantDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOpen = registrant !== null;
  const surveyEntries = registrant ? formatSurveyDetails(registrant.details) : [];

  const handleDelete = async () => {
    if (!registrant) return;
    setDeleting(true);
    try {
      await onDelete(registrant.id);
      setConfirmDelete(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet isOpen={isOpen} onOpenChange={(next) => { if (!next) onClose(); }} isDetached shouldAutoFocus>
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="mx-auto max-w-lg">
            <Sheet.Dialog className="rounded-[2px] border border-noir/[0.08] bg-white p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]">
              {registrant && (
                <>
                  <Sheet.Header className="p-0">
                    <Sheet.Heading className="text-[15px] font-normal tracking-[0.02em] text-noir">
                      {registrant.prenom} {registrant.nom}
                    </Sheet.Heading>
                  </Sheet.Header>

                  <div className="mt-4">
                    <div className={rowClass}>
                      <span className={labelClass}>Téléphone</span>
                      <span className={valueClass}>{registrant.telephone}</span>
                    </div>
                    <div className={rowClass}>
                      <span className={labelClass}>Inscription</span>
                      <span className={valueClass}>{new Date(registrant.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className={rowClass}>
                      <span className={labelClass}>Bilan réservé</span>
                      <span className={valueClass}>
                        {registrant.bilan ? `${registrant.bilan.date} à ${registrant.bilan.heure.slice(0, 5)}` : 'Pas encore réservé'}
                      </span>
                    </div>
                    {surveyEntries.map((entry) => (
                      <div key={entry.key} className={rowClass}>
                        <span className={labelClass}>{entry.label}</span>
                        <span className={valueClass}>{entry.value}</span>
                      </div>
                    ))}
                    {surveyEntries.length === 0 && (
                      <p className="pt-2 text-[11px] text-black/30">Questionnaire pas encore rempli.</p>
                    )}
                  </div>

                  <Sheet.Footer className="mt-6 flex justify-between p-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-light text-red-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 size={13} strokeWidth={1.6} />
                      Supprimer l'inscription
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-[2px] border border-noir/15 text-[10px] font-light uppercase tracking-[0.12em] text-black/55 transition-colors hover:text-noir hover:border-noir/25"
                    >
                      Fermer
                    </button>
                  </Sheet.Footer>
                </>
              )}
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette inscription ?"
        description={registrant ? `${registrant.prenom} ${registrant.nom} sera retiré(e) définitivement de la liste des inscrits.` : undefined}
        confirmLabel="Supprimer"
        loading={deleting}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
