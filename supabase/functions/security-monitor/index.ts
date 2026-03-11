import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  type: 'suspicious_login' | 'rate_limit_exceeded' | 'data_access_anomaly' | 'failed_auth_attempts'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  user_id?: string
  ip_address?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { alert } = await req.json() as { alert: SecurityAlert }
      
      // Log security alert
      console.log('Security Alert:', alert)
      
      // Store in audit log
      await supabaseClient.rpc('log_security_audit', {
        p_action: `SECURITY_ALERT_${alert.type.toUpperCase()}`,
        p_table_name: 'security_monitor',
        p_record_id: null,
        p_old_values: null,
        p_new_values: alert.details
      })

      // Check if immediate action is needed
      if (alert.severity === 'critical') {
        // For critical alerts, you might want to:
        // 1. Send notifications to admins
        // 2. Temporarily suspend user accounts
        // 3. Block IP addresses
        console.warn('CRITICAL SECURITY ALERT:', alert)
      }

      return new Response(
        JSON.stringify({ success: true, alert_logged: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (req.method === 'GET') {
      // Fetch recent security events for monitoring dashboard
      const { data: recentAlerts, error } = await supabaseClient
        .from('security_audit_log')
        .select('*')
        .ilike('action', 'SECURITY_ALERT_%')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ alerts: recentAlerts }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Security monitor error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})