// =============================================
// ⚠️ DEPRECATED: pagarme-init (V4 Legacy)
// ✅ Migre para: pagarme-subscribe (V5)
// Este endpoint foi descontinuado em favor do V5
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⚠️ [DEPRECATED] pagarme-init called - this endpoint is deprecated');

  return new Response(JSON.stringify({
    error: 'ENDPOINT_DEPRECATED',
    message: 'Este endpoint foi descontinuado. Use pagarme-subscribe (V5) em vez disso.',
    details: {
      deprecated_endpoint: 'pagarme-init',
      new_endpoint: 'pagarme-subscribe',
      migration_guide: 'https://docs.pagar.me/v5',
      hint: 'Atualize sua aplicação para chamar pagarme-subscribe com o payload V5 correto.'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 410, // Gone
  });
});
