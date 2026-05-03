import { supabase } from './supabaseClient';
import type { SiteAnnouncement } from '../types/database';

/**
 * Pop-up d'accueil lié à un événement.
 * Convention : `cta_url = /evenements/{slug}` relie le site_announcement à l'event.
 * On garde l'id en form state pour pouvoir update/delete de manière idempotente même si le slug change.
 */

export interface EventPopupSyncInput {
  popupId: string | null;
  enabled: boolean;
  active: boolean;
  slug: string;
  eventDate: string;
  imageUrl: string | null;
  title: string;
  subtitle: string | null;
  message: string | null;
  ctaLabel: string | null;
}

function pickCtaUrl(slug: string): string {
  return `/evenements/${slug}`;
}

/** Récupère le popup rattaché à un event (via cta_url) — null si aucun. */
export async function fetchPopupForEventSlug(slug: string): Promise<SiteAnnouncement | null> {
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .eq('cta_url', pickCtaUrl(slug))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) console.warn('[fetchPopupForEventSlug]', error.message);
    return null;
  }
  return data;
}

/** Upsert/delete idempotent du popup attaché à un event. */
export async function syncEventPopup(input: EventPopupSyncInput): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!input.enabled) {
    if (input.popupId) {
      const { error } = await db
        .from('site_announcements')
        .delete()
        .eq('id', input.popupId);
      if (error) throw new Error(error.message);
    }
    return null;
  }

  const payload = {
    type: 'event' as const,
    title: input.title.trim() || 'Événement Pessóra',
    subtitle: input.subtitle?.trim() || null,
    message: input.message?.trim() || null,
    image_url: input.imageUrl || null,
    cta_label: input.ctaLabel?.trim() || "S'inscrire",
    cta_url: pickCtaUrl(input.slug),
    expires_at: input.eventDate || null,
    active: input.active,
    dismiss_mode: 'once_session' as const,
    priority: 10,
  };

  if (input.popupId) {
    const { error } = await db
      .from('site_announcements')
      .update(payload)
      .eq('id', input.popupId);
    if (error) throw new Error(error.message);
    return input.popupId;
  }

  const { data, error } = await db
    .from('site_announcements')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (data?.id as string) ?? null;
}
