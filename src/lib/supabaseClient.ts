import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis dans .env')
}

/**
 * Client en `any` : `types/database.ts` ne satisfait pas encore `GenericSchema` (Supabase v2.103+),
 * ce qui faisait tomber `Schema` à `never` et cassait `rpc`. Les lignes BDD restent typées via `types/database`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- schéma PostgREST maintenu à la main, voir commentaire ci-dessus
export const supabase: SupabaseClient<any> = createClient(supabaseUrl, supabaseAnonKey)
