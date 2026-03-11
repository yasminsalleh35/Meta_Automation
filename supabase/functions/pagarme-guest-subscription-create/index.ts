// ⚠️ DEPRECATED: Este endpoint foi descontinuado
// ✅ Use /checkout com query params para guest checkout

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⚠️ [DEPRECATED] pagarme-guest-subscription-create called - should use /checkout page');

  return new Response(JSON.stringify({
    error: 'ENDPOINT_DEPRECATED',
    message: 'Este endpoint foi descontinuado.',
    hint: 'Redirecione para /checkout?plan=mensal ou /checkout?plan=anual',
    redirect_url: '/checkout'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 410, // Gone
  });
});
