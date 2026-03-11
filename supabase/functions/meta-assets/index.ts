import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      throw new Error('No authorization header');
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid or expired token');
    }

    console.log('User authenticated:', { userId: user.id, email: user.email });

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
        const accountsResponse = await fetch(
          `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,account_id&access_token=${accessToken}`
        );

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          results.accounts = (accountsData.data || []).map((account: any) => ({
            id: account.id,
            name: account.name,
            currency: account.currency || 'BRL',
            status: account.account_status === 1 ? 'ACTIVE' : 'INACTIVE',
            permissions: ['ads_read', 'ads_management']
          }));
          console.log(`✅ Found ${results.accounts.length} ad accounts`);
        } else {
          const errorData = await accountsResponse.json();
          results.errors.push(`Ad accounts error: ${errorData.error?.message || 'Unknown error'}`);
          console.warn('Ad accounts fetch failed:', errorData);
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
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,fan_count,access_token&access_token=${accessToken}`
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          results.pages = (pagesData.data || []).map((page: any) => ({
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
                  `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.access_token}`
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
          const errorData = await pagesResponse.json();
          results.errors.push(`Pages error: ${errorData.error?.message || 'Unknown error'}`);
          console.warn('Pages fetch failed:', errorData);
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