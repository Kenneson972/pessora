// supabase/functions/create-subscription-session/index.ts
//
// Óra+ archivé côté public (décision cliente 10/09) : l'offre repasse en
// présentiel, plus aucune souscription en ligne. Cette fonction n'a plus
// aucun appelant côté front (aucun bouton/lien ne l'invoque), mais restait
// joignable directement par son URL — elle est donc bloquée en dur plutôt
// que supprimée, pour ne pas avoir à retoucher ce fichier si l'offre revient
// un jour. Le secret STRIPE_ORA_PLUS_PRICE_ID n'est plus lu ici : ne pas le
// retirer du projet Supabase depuis ce commit, c'est alcyone qui s'en charge.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ error: "L'abonnement Óra+ n'est plus disponible en ligne. Renseignez-vous au bar." }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
