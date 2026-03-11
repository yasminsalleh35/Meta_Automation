import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toMessage, toObject } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting automatic Ad Set verification process...')

    // Buscar Ad Sets pendentes de verificação há mais de 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: pendingVerifications, error: queryError } = await supabaseClient
      .from('expected_ad_set_settings')
      .select('*')
      .eq('is_pending_verification', true)
      .not('ad_set_id', 'is', null)
      .or(`last_verified_at.is.null,last_verified_at.lt.${fiveMinutesAgo}`)
      .limit(10) // Limitar para não sobrecarregar

    if (queryError) {
      console.error('Error fetching pending verifications:', queryError)
      throw queryError
    }

    console.log(`📊 Found ${pendingVerifications?.length || 0} Ad Sets pending verification`)

    let processedCount = 0
    let successCount = 0
    let errorCount = 0

    for (const verification of pendingVerifications || []) {
      try {
        console.log(`🔍 Processing Ad Set: ${verification.ad_set_id}`)
        
        // Chamar a função de verificação existente
        const { data: verificationResult, error: verifyError } = await supabaseClient.functions.invoke(
          'verify-and-correct-ad-set',
          {
            body: {
              ad_set_id: verification.ad_set_id,
              ad_account_id: verification.ad_account_id
            }
          }
        )

        if (verifyError) {
          console.error(`❌ Verification failed for ${verification.ad_set_id}:`, verifyError)
          errorCount++
        } else {
          console.log(`✅ Verification completed for ${verification.ad_set_id}:`, verificationResult.verification_status)
          successCount++
        }

        processedCount++
        
        // Pequeno delay entre verificações para não sobrecarregar a Meta API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error processing ${verification.ad_set_id}:`, error)
        errorCount++
        processedCount++
      }
    }

    const summary = {
      processed: processedCount,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    }

    console.log('📈 Auto-verification summary:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (err: unknown) {
    console.error('❌ Auto-verification process failed:', toObject(err))
    
    return new Response(
      JSON.stringify({
        success: false,
        error: toMessage(err)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})