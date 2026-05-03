import { Link } from 'react-router-dom';
import { Alert } from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

interface AdminErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Alerte erreur admin — wrapper autour de <Alert> (@heroui/react) pour garder
 * une API identique côté appelants (16 sites). Ton éditorial, rayon 2px,
 * liens soulignés fin plutôt que pleins boutons.
 */
export function AdminErrorAlert({ message, onRetry }: AdminErrorAlertProps) {
  return (
    <Alert
      status="danger"
      className="mb-6 rounded-[2px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-[12px] leading-relaxed text-red-950/90"
      role="alert"
    >
      <Alert.Indicator className="mr-3 mt-0.5 text-red-700">
        <AlertTriangle size={14} strokeWidth={1.5} aria-hidden="true" />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Description className="text-[12px] leading-relaxed text-red-950/90">
          {message}
        </Alert.Description>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-normal">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] inline-flex items-center border-b border-red-900/30 pb-px text-red-900/90 transition-colors hover:border-red-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30 focus-visible:ring-offset-2"
            >
              Réessayer
            </button>
          )}
          <Link
            to="/contact"
            className="min-h-[44px] inline-flex items-center border-b border-red-900/20 pb-px text-red-900/70 transition-colors hover:border-red-900/50 hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30 focus-visible:ring-offset-2"
          >
            Page Contact
          </Link>
        </div>
      </Alert.Content>
    </Alert>
  );
}
