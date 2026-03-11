
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdSetVerificationRequest {
  ad_set_id: string
  ad_account_id?: string
}

interface ExpectedAdSetSettings {
  id: string
  ad_account_id: string
  campaign_id: string
  ad_set_id: string
  expected_name: string
  expected_locality_json: any
  expected_budget_amount: number
  expected_budget_type: 'daily_budget' | 'lifetime_budget'
  expected_instagram_profile_id?: string
  verification_status: string
  last_verified_at?: string
  is_pending_verification: boolean
  error_details?: any
}

interface MetaApiResponse {
  name?: string
  targeting?: {
    geo_locations?: any
  }
  daily_budget?: string
  lifetime_budget?: string
  promoted_object?: {
    instagram_profile_id?: string
    page_id?: string
  }
  status?: string
  spend?: string
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

    const { ad_set_id, ad_account_id } = await req.json() as AdSetVerificationRequest

    console.log(`🔍 Starting verification for Ad Set: ${ad_set_id}`)

    // 1. Buscar dados desejados no Supabase
    const { data: expectedSettings, error: dbError } = await supabaseClient
      .from('expected_ad_set_settings')
      .select('*')
      .eq('ad_set_id', ad_set_id)
      .single()

    if (dbError || !expectedSettings) {
      console.error('❌ Expected settings not found:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Expected settings not found for this Ad Set',
          details: dbError 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const settings = expectedSettings as ExpectedAdSetSettings

    // 2. Buscar dados atuais da Meta API
    const metaAccessToken = await getMetaAccessToken(supabaseClient, settings.ad_account_id)
    
    if (!metaAccessToken) {
      throw new Error('Meta access token not found')
    }

    const actualData = await fetchAdSetFromMeta(ad_set_id, metaAccessToken)

    // 3. Comparar e preparar correções
    const updates = await compareAndPrepareUpdates(settings, actualData)

    // 4. Aplicar correções se necessário
    let correctionResult = null
    if (Object.keys(updates).length > 0) {
      console.log('🔧 Applying corrections:', updates)
      correctionResult = await updateAdSetInMeta(ad_set_id, updates, metaAccessToken)
    }

    // 5. Atualizar status no Supabase
    const verificationStatus = Object.keys(updates).length > 0 ? 'CORRECTED' : 'VERIFIED_OK'
    
    await supabaseClient
      .from('expected_ad_set_settings')
      .update({
        verification_status: verificationStatus,
        last_verified_at: new Date().toISOString(),
        is_pending_verification: false,
        error_details: correctionResult?.error || null
      })
      .eq('id', settings.id)

    console.log(`✅ Verification completed with status: ${verificationStatus}`)

    return new Response(
      JSON.stringify({
        success: true,
        verification_status: verificationStatus,
        corrections_applied: Object.keys(updates),
        correction_result: correctionResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Verification failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any)?.message,
        stack: (error as any)?.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getMetaAccessToken(supabaseClient: any, adAccountId: string): Promise<string | null> {
  try {
    // Buscar token de acesso da integração Meta
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('access_token')
      .eq('provider', 'meta')
      .eq('status', 'active')
      .single()

    return integration?.access_token || null
  } catch (error) {
    console.error('Error fetching Meta access token:', error)
    return null
  }
}

async function fetchAdSetFromMeta(adSetId: string, accessToken: string): Promise<MetaApiResponse> {
  const fields = 'name,targeting,daily_budget,lifetime_budget,promoted_object,status,spend'
  const url = `https://graph.facebook.com/v23.0/${adSetId}?fields=${fields}&access_token=${accessToken}`

  console.log(`📡 Fetching Ad Set data from Meta API: ${adSetId}`)

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    console.error('Meta API Error:', data)
    throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`)
  }

  return data
}

async function compareAndPrepareUpdates(
  expected: ExpectedAdSetSettings,
  actual: MetaApiResponse
): Promise<Record<string, any>> {
  const updates: Record<string, any> = {}

  console.log('🔄 Comparing expected vs actual data...')

  // Verificação de Localidade
  if (expected.expected_locality_json && actual.targeting?.geo_locations) {
    const localityMatch = compareLocality(expected.expected_locality_json, actual.targeting.geo_locations)
    if (!localityMatch) {
      console.log('📍 Locality mismatch detected')
      updates.targeting = {
        ...actual.targeting,
        geo_locations: expected.expected_locality_json
      }
    }
  }

  // Verificação de Orçamento
  const budgetField = expected.expected_budget_type
  const actualBudget = budgetField === 'daily_budget' ? actual.daily_budget : actual.lifetime_budget
  const expectedBudget = expected.expected_budget_amount.toString()

  if (actualBudget !== expectedBudget) {
    console.log(`💰 Budget mismatch: expected ${expectedBudget}, got ${actualBudget}`)
    
    // Verificar se podemos reduzir o orçamento (deve ser 10% maior que o gasto)
    if (parseInt(expectedBudget) < parseInt(actualBudget || '0')) {
      const spentAmount = parseInt(actual.spend || '0')
      const minimumAllowed = Math.ceil(spentAmount * 1.1)
      
      if (parseInt(expectedBudget) >= minimumAllowed) {
        updates[budgetField] = expectedBudget
      } else {
        console.log(`⚠️ Cannot reduce budget below minimum threshold: ${minimumAllowed}`)
      }
    } else {
      updates[budgetField] = expectedBudget
    }
  }

  // Verificação da Página do Instagram
  if (expected.expected_instagram_profile_id) {
    const actualInstagramId = actual.promoted_object?.instagram_profile_id || actual.promoted_object?.page_id
    
    if (actualInstagramId !== expected.expected_instagram_profile_id) {
      console.log('📸 Instagram profile mismatch detected')
      updates.promoted_object = {
        ...actual.promoted_object,
        instagram_profile_id: expected.expected_instagram_profile_id
      }
    }
  }

  return updates
}

function compareLocality(expected: any, actual: any): boolean {
  try {
    // Comparação robusta de localidades usando JSON string comparison
    // Em casos reais, seria melhor comparar por IDs/keys específicos
    const expectedStr = JSON.stringify(sortObjectKeys(expected))
    const actualStr = JSON.stringify(sortObjectKeys(actual))
    
    return expectedStr === actualStr
  } catch (error) {
    console.error('Error comparing locality:', error)
    return false
  }
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys).sort()
  } else if (obj !== null && typeof obj === 'object') {
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key])
    })
    return sorted
  }
  return obj
}

async function updateAdSetInMeta(
  adSetId: string,
  updates: Record<string, any>,
  accessToken: string
): Promise<{ success: boolean; error?: any }> {
  const url = `https://graph.facebook.com/v23.0/${adSetId}`

  console.log(`🔧 Updating Ad Set in Meta API: ${adSetId}`, updates)

  try {
    const formData = new URLSearchParams()
    formData.append('access_token', accessToken)
    
    // Converter objetos complexos para JSON strings
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value.toString())
      }
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Update Error:', data)
      return { success: false, error: data.error }
    }

    console.log('✅ Ad Set updated successfully in Meta API')
    return { success: true }

  } catch (error) {
    console.error('Error updating Ad Set in Meta:', error)
    return { success: false, error: (error as any)?.message }
  }
}
