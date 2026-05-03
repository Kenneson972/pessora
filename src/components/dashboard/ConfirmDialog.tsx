import { useCallback, type ReactNode } from 'react';
import { Sheet } from '@heroui-pro/react';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Texte du bouton principal pendant l'action (ex. « Retrait… » pour newsletter). */
  loadingLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const cancelBtnClass =
  'h-10 px-4 rounded-[2px] border border-noir/15 text-[10px] font-light uppercase tracking-[0.12em] text-black/55 transition-colors hover:text-noir hover:border-noir/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25 focus-visible:ring-offset-2';

const confirmBtnClass =
  'h-10 px-4 rounded-[2px] bg-noir text-white text-[10px] font-normal uppercase tracking-[0.12em] transition-colors hover:bg-anthracite disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/40 focus-visible:ring-offset-2';

/**
 * Confirmation destructive (pas de `window.confirm`) — basée sur le <Sheet> HeroUI Pro.
 * Sheet "detached" bottom → carte flottante avec rounded-2xl, swipe-to-dismiss sur mobile,
 * backdrop blur, focus trap ARIA, Échap + clic fond gérés par RAC.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  loadingLabel = 'Suppression…',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  // Pendant le loading, on bloque toute tentative de fermeture (Esc, clic backdrop, swipe).
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (loading) return;
      if (!next) onClose();
    },
    [loading, onClose],
  );

  return (
    <Sheet
      isOpen={open}
      onOpenChange={handleOpenChange}
      isDetached
      isDismissable={!loading}
      shouldAutoFocus
    >
      <Sheet.Backdrop variant="blur">
        <Sheet.Content className="mx-auto max-w-md">
          <Sheet.Dialog className="rounded-[2px] border border-noir/[0.08] bg-white p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]">
            <Sheet.Header className="p-0">
              <Sheet.Heading className="text-[13px] font-normal tracking-[0.04em] text-noir">
                {title}
              </Sheet.Heading>
              {description != null && description !== '' && (
                <p className="mt-3 text-[12px] leading-relaxed text-black/55">
                  {description}
                </p>
              )}
            </Sheet.Header>
            <Sheet.Footer className="mt-6 flex justify-end gap-2 p-0">
              <button
                type="button"
                disabled={loading}
                onClick={() => !loading && onClose()}
                className={cancelBtnClass}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                data-confirm-focus
                disabled={loading}
                onClick={() => void onConfirm()}
                className={confirmBtnClass}
              >
                {loading ? loadingLabel : confirmLabel}
              </button>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
