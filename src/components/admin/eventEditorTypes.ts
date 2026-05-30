import type { Event } from '../../types/database';

export interface EventWithCount extends Event {
  event_registrations: { count: number | string }[];
}

export const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'event' as Event['type'],
  date: '',
  heure: '',
  location: '',
  meeting_point: '',
  description: '',
  places_max: '',
  image_url: '',
  gallery: [] as string[],
  price: '',
  is_free: true,
  registration_open: true,
  active: true,
  popup_id: null as string | null,
  popup_enabled: false,
  popup_active: true,
  popup_title: '',
  popup_subtitle: '',
  popup_message: '',
  popup_cta_label: "S'inscrire",
};

export type FormState = typeof EMPTY_FORM;

export const TYPE_OPTIONS: Event['type'][] = ['event', 'popup', 'atelier', 'partenariat', 'bilan', 'run_club'];

export const TYPE_LABELS: Record<Event['type'], string> = {
  event: 'Événement',
  popup: 'Pop-up',
  atelier: 'Atelier',
  partenariat: 'Partenariat',
  bilan: 'Bilan',
  run_club: 'Course',
};

export function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function formatLongDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const inputBase = 'w-full bg-white border border-noir/[0.09] rounded-[2px] px-3.5 py-3 text-base sm:text-[13px] text-noir placeholder:text-black/30 focus-visible:outline-none focus-visible:border-noir/35 focus-visible:ring-2 focus-visible:ring-sapin/20 transition-colors';

export const labelBase = 'block text-[9px] font-medium uppercase tracking-[0.22em] text-black/45 mb-1.5';
