import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toMessage, toObject } from '../_shared/errors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is super admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'logs'

    if (action === 'logs') {
      // Get recent security audit logs
      const { data: logs, error } = await supabaseAdmin
        .from('security_audit_log')
        .select(`
          id,
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching audit logs:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch audit logs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ logs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'stats') {
      // Get security statistics
      const { data: totalLogs } = await supabaseAdmin
        .from('security_audit_log')
        .select('id', { count: 'exact' })

      const { data: recentActivity } = await supabaseAdmin
        .from('security_audit_log')
        .select('action', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const { data: sensitiveTableAccess } = await supabaseAdmin
        .from('security_audit_log')
        .select('table_name', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      return new Response(
        JSON.stringify({
          totalLogs: totalLogs?.length || 0,
          recentActivity: recentActivity?.length || 0,
          sensitiveTableAccess: sensitiveTableAccess?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Security audit error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})