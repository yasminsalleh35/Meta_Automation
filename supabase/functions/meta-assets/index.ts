import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { fetchAllGraphPages } from '../_shared/metaPaging.ts';
import { GRAPH_BASE } from '../_shared/meta.ts'; // audit PLT-03
import { HttpError, authErrorResponse } from '../_shared/auth.ts';

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
    // Create Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new HttpError(401, 'unauthenticated');
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new HttpError(401, 'unauthenticated');
    }

    console.log('User authenticated:', { userId: user.id });

    // Get active Meta Ads integration for this user
    const { data: integration, error: integrationError } = await supabaseServiceClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration || !integration.access_token) {
      console.error('No active Meta Ads integration found');
      throw new Error('No active Meta Ads integration found');
    }

    const accessToken = integration.access_token;
    const graphInit: RequestInit = { headers: { Authorization: `Bearer ${accessToken}` } };
    console.log('Found Meta integration with token');

    // Parse request body to get what assets to fetch
    const body = await req.json().catch(() => ({}));
    const { fetchAccounts = true, fetchPages = true, fetchInstagram = true } = body;

    const results: any = {
      accounts: [],
      pages: [],
      instagramAccounts: [],
      errors: []
    };

    // Fetch Ad Accounts
    if (fetchAccounts) {
      try {
        console.log('Fetching Meta ad accounts...');
        // audit CMP-11: segue paging.next (limitado a MAX_GRAPH_PAGES)
        const accountsResponse = await fetchAllGraphPages(
          `${GRAPH_BASE}/me/adaccounts?fields=id,name,account_status,currency,timezone_name,account_id&limit=100`,
          graphInit
        );

        if (accountsResponse.ok) {
          results.accounts = accountsResponse.data.map((account: any) => ({
            id: account.id,
            name: account.name,
            currency: account.currency || 'BRL',
            status: account.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
            permissions: ['ads_read', 'ads_management']
          }));
          console.log(`✅ Found ${results.accounts.length} ad accounts`);
        } else {
          results.errors.push(`Ad accounts error: ${accountsResponse.error?.message || 'Unknown error'}`);
          console.warn('Ad accounts fetch failed:', accountsResponse.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Ad accounts fetch error: ${errorMsg}`);
        console.error('Ad accounts error:', error);
      }
    }

    // Fetch Facebook Pages
    if (fetchPages) {
      try {
        console.log('Fetching Facebook pages...');
        const pagesResponse = await fetchAllGraphPages(
          `${GRAPH_BASE}/me/accounts?fields=id,name,category,fan_count,access_token&limit=100`,
          graphInit
        );

        if (pagesResponse.ok) {
          results.pages = pagesResponse.data.map((page: any) => ({
            id: page.id,
            name: page.name,
            category: page.category || 'Page',
            followers: page.fan_count || 0,
            access_token: page.access_token // Keep for Instagram fetching
          }));
          console.log(`✅ Found ${results.pages.length} Facebook pages`);

          // If Instagram is requested, fetch Instagram Business Accounts for each page
          if (fetchInstagram && results.pages.length > 0) {
            console.log('Fetching Instagram Business Accounts for pages...');
            
            for (const page of results.pages) {
              try {
                const instagramResponse = await fetch(
                  `${GRAPH_BASE}/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.access_token}`
                );

                if (instagramResponse.ok) {
                  const instagramData = await instagramResponse.json();
                  if (instagramData.instagram_business_account) {
                    const account = instagramData.instagram_business_account;
                    results.instagramAccounts.push({
                      id: account.id,
                      name: account.name || account.username,
                      username: account.username,
                      profile_pic: account.profile_picture_url,
                      connected_page_id: page.id,
                      connected_page_name: page.name
                    });
                  }
                }
              } catch (error) {
                console.warn(`Instagram fetch failed for page ${page.id}:`, error);
              }
            }
            
            console.log(`✅ Found ${results.instagramAccounts.length} Instagram Business accounts`);
          }

          // Remove access_token from pages before returning (security)
          results.pages = results.pages.map((page: any) => {
            const { access_token, ...pageWithoutToken } = page;
            return pageWithoutToken;
          });

        } else {
          results.errors.push(`Pages error: ${pagesResponse.error?.message || 'Unknown error'}`);
          console.warn('Pages fetch failed:', pagesResponse.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Pages fetch error: ${errorMsg}`);
        console.error('Pages error:', error);
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {

    // audit QA-03: falta de login → 401 (não 500)

    const authResp = authErrorResponse(error, corsHeaders);

    if (authResp) return authResp;
    console.error('Error in meta-assets function:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMsg,
        accounts: [],
        pages: [],
        instagramAccounts: [],
        errors: [errorMsg]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});