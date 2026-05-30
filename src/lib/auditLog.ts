import { supabase } from './supabaseClient';

type AuditAction =
  | 'order.status_change'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.archive'
  | 'event.create'
  | 'event.update'
  | 'event.delete'
  | 'member.update'
  | 'member.delete'
  | 'ora_plus.validate'
  | 'banner.update'
  | 'carousel.update'
  | 'gamme.create'
  | 'gamme.update'
  | 'gamme.delete'
  | 'slot.create'
  | 'slot.update'
  | 'slot.delete';

interface AuditEntry {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('admin_audit_log').insert({
      admin_id: user.id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      details: entry.details ?? null,
    }).single();
  } catch {
    // Silencieux — ne bloque jamais l'action principale
  }
}
