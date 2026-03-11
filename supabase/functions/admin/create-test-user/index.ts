
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toMessage, toObject } from '../../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, name, password, businessName, businessDescription, isTestUser } = await req.json()

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar o usuário
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        is_test_user: isTestUser
      }
    })

    if (createError) {
      throw new Error(`Erro ao criar usuário: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('Usuário não foi criado')
    }

    // Atualizar profile com dados do negócio
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        status: 'active'
      })
      .eq('id', newUser.user.id)

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError)
    }

    // Criar configurações de negócio se fornecidas
    if (businessName || businessDescription) {
      const { error: businessError } = await supabaseAdmin
        .from('business_settings')
        .insert({
          user_id: newUser.user.id,
          business_name: businessName,
          business_description: businessDescription,
          category: 'Teste',
          target_audience: 'Público de teste para demonstração da plataforma',
          business_goals: 'Testar funcionalidades da Camply',
          main_product: 'Produto/serviço de demonstração'
        })

      if (businessError) {
        console.error('Erro ao criar business_settings:', businessError)
      }
    }

    // Buscar configurações globais do Meta Ads
    const { data: metaConfig } = await supabaseAdmin.rpc('get_meta_ads_config')

    if (metaConfig && metaConfig.length > 0) {
      // Criar integração Meta Ads para o usuário
      const { error: integrationError } = await supabaseAdmin
        .from('integrations')
        .insert({
          user_id: newUser.user.id,
          provider: 'meta_ads',
          status: 'active',
          app_id: metaConfig[0].app_id,
          app_secret: metaConfig[0].app_secret,
          business_manager_id: metaConfig[0].business_manager_id,
          access_token: 'demo_token_' + Math.random().toString(36).slice(-10),
          selected_accounts: [],
          selected_pages: []
        })

      if (integrationError) {
        console.error('Erro ao criar integração:', integrationError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          name: name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    console.error('Erro na função:', toObject(err))
    return new Response(
      JSON.stringify({ error: toMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
