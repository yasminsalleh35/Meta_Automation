import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveMetaIntegration } from "../_shared/metaIntegration.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[meta-ads-account-pages] Request received');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[meta-ads-account-pages] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error('[meta-ads-account-pages] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[meta-ads-account-pages] User authenticated:', user.id);

    // Get Meta integration using shared resolver
    const integration = await resolveMetaIntegration(user.id);
    if (!integration) {
      console.log('[meta-ads-account-pages] No active Meta integration found');
      return new Response(
        JSON.stringify({ 
          adAccounts: [], 
          pages: [],
          message: 'No active Meta integration found' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[meta-ads-account-pages] Active integration found, provider:', integration.provider);

    const accessToken = integration.access_token;
    const API_VERSION = "v19.0";

    // Fetch ad accounts
    console.log('[meta-ads-account-pages] Fetching ad accounts...');
    let adAccounts = [];
    try {
      const adAccountsUrl = `https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=id,name,currency,account_status,capabilities,permissions&access_token=${accessToken}`;
      const adAccountsRes = await fetch(adAccountsUrl, {
        signal: AbortSignal.timeout(15000)
      });

      if (adAccountsRes.ok) {
        const adAccountsData = await adAccountsRes.json();
        adAccounts = (adAccountsData.data || []).map((account: any) => ({
          id: account.id,
          name: account.name,
          currency: account.currency,
          status: account.account_status,
          permissions: account.permissions || []
        }));
        console.log('[meta-ads-account-pages] Ad accounts fetched:', adAccounts.length);
      } else {
        const errorData = await adAccountsRes.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[meta-ads-account-pages] Ad accounts fetch failed:', adAccountsRes.status, errorData);
      }
    } catch (error) {
      console.error('[meta-ads-account-pages] Ad accounts fetch error:', error);
    }

    // Fetch pages
    console.log('[meta-ads-account-pages] Fetching pages...');
    let pages = [];
    try {
      const pagesUrl = `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,category,followers_count&access_token=${accessToken}`;
      const pagesRes = await fetch(pagesUrl, {
        signal: AbortSignal.timeout(15000)
      });

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        pages = (pagesData.data || []).map((page: any) => ({
          id: page.id,
          name: page.name,
          category: page.category,
          followers: page.followers_count
        }));
        console.log('[meta-ads-account-pages] Pages fetched:', pages.length);
      } else {
        const errorData = await pagesRes.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[meta-ads-account-pages] Pages fetch failed:', pagesRes.status, errorData);
      }
    } catch (error) {
      console.error('[meta-ads-account-pages] Pages fetch error:', error);
    }

    const result = {
      adAccounts,
      pages,
      message: `Found ${adAccounts.length} ad accounts and ${pages.length} pages`,
      cached: false
    };

    console.log('[meta-ads-account-pages] Success:', result.message);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('[meta-ads-account-pages] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        adAccounts: [],
        pages: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});