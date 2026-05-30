import { supabase } from '../lib/supabaseClient';

/** Client admin non contraint — évite le cast `as any` répété dans 17+ fichiers. */
const db = supabase as any;

/**
 * Hook partagé pour les opérations CRUD admin sur une table donnée.
 * Remplace le pattern `const db = supabase as any; db.from(t).select().eq(...)`
 */
export function useAdminTable(table: string) {
  const from = () => db.from(table);

  return {
    /** SELECT avec filtres chaînables */
    select: (columns = '*') => from().select(columns),

    /** INSERT d'une ou plusieurs rows */
    insert: (row: Record<string, unknown> | Record<string, unknown>[]) => from().insert(row),

    /** UPDATE avec filtre id */
    update: (id: string, row: Record<string, unknown>) => from().update(row).eq('id', id),

    /** DELETE par id */
    delete: (id: string) => from().delete().eq('id', id),

    /** Accès direct au builder pour les requêtes complexes */
    db,
    from,
  };
}
