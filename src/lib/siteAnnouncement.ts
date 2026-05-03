import { supabase } from './supabaseClient';
import type { SiteAnnouncement } from '../types/database';

/** Première annonce active, la plus prioritaire (priority asc), la plus récente en ex-aequo. */
export async function fetchActiveSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .eq('active', true)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) console.warn('[site_announcements]', error.message);
    return null;
  }
  return data;
}
