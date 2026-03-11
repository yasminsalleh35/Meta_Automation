
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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

    const { user_id } = await req.json()

    if (!user_id) {
      console.log('No user_id provided')
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Checking role for user_id:', user_id)

    // Get user role from user_roles table
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single()

    console.log('Database query result:', { data, error })

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - user has default 'user' role
        console.log('No role found, returning default user role')
        return new Response(
          JSON.stringify({ role: 'user' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ role: 'user' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    const userRole = data?.role || 'user'
    console.log('Returning role:', userRole)

    return new Response(
      JSON.stringify({ role: userRole }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ role: 'user' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
