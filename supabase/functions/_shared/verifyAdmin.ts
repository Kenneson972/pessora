import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Vérifie que l'appelant est un admin Pessora.
 * À utiliser dans TOUTES les Edge Functions admin.
 *
 * Usage:
 *   const { isAdmin, user, error } = await verifyAdmin(req);
 *   if (!isAdmin) return error;
 */
export async function verifyAdmin(req: Request): Promise<{
  isAdmin: boolean;
  user?: { id: string; email?: string };
  error?: Response;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      isAdmin: false,
      error: new Response(JSON.stringify({ error: 'Authentification requise' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      isAdmin: false,
      error: new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  // Vérifier le rôle admin dans profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      isAdmin: false,
      error: new Response(JSON.stringify({ error: 'Accès refusé — admin uniquement' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return {
    isAdmin: true,
    user: { id: user.id, email: user.email },
  };
}
