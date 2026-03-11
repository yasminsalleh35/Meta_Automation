import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CACHE: In-memory cache for validation results (5 minutes TTL)
const validationCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCachedValidation(userId: string): any | null {
  const cached = validationCache.get(userId);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    validationCache.delete(userId);
    console.log(`[CACHE] Validation cache expired for user ${userId}`);
    return null;
  }
  
  console.log(`[CACHE] Using cached validation for user ${userId}, age: ${Math.round(age / 1000)}s`);
  return cached.result;
}

function setCachedValidation(userId: string, result: any) {
  validationCache.set(userId, {
    result,
    timestamp: Date.now()
  });
  console.log(`[CACHE] Cached validation for user ${userId}`);
}

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

    console.log('User authenticated for validation:', { userId: user.id, email: user.email });

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
    console.log('Found Meta integration with token for validation');

    // ✅ CACHE: Check cache first
    const cachedResult = getCachedValidation(user.id);
    if (cachedResult) {
      console.log('[CACHE] Returning cached validation result');
      return new Response(
        JSON.stringify(cachedResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Get request body for app credentials
    const { accessToken: requestToken, configuredAppId, configuredAppSecret } = await req.json().catch(() => ({
      accessToken: null,
      configuredAppId: null,
      configuredAppSecret: null
    }));

    // Validate token and get permissions
    try {
      // Generate App Access Token for validation
      const appAccessToken = `${configuredAppId}|${configuredAppSecret}`;
      
      console.log('🔍 Validating token via Facebook API using App Access Token:', {
        url: `https://graph.facebook.com/v19.0/debug_token?input_token=TOKEN_MASKED&access_token=APP_TOKEN`,
        appId: configuredAppId
      });

      const debugUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`;
      const response = await fetch(debugUrl);
      console.log('📡 Facebook API response status:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Facebook API validation failed with App Access Token:', {
          status: response.status,
          error: errorText
        });
        
        // Fallback: Try basic /me endpoint validation
        console.log('🔄 Attempting fallback validation via /me endpoint...');
        
        const meResponse = await fetch(
          `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('✅ Fallback validation successful via /me endpoint:', {
            userId: meData.id,
            name: meData.name
          });
          
          // Return minimal valid response for non-admin users
          return new Response(JSON.stringify({
            isValid: true,
            appId: configuredAppId,
            userId: meData.id,
            grantedPermissions: ['public_profile'], // Basic permission
            permissionAnalysis: {
              essential: { granted: ['public_profile'], missing: [] },
              hasEssentialPermissions: true
            },
            hasEssentialPermissions: true,
            hasRequiredPermissions: true,
            canAccessPages: false,
            canAccessInstagram: false,
            canAccessWhatsApp: false,
            availableCategories: ['essential'],
            missingCategories: ['pages', 'instagram', 'whatsapp'],
            issues: [],
            recommendations: ['Token validated for non-admin user with basic permissions'],
            needsReauthorization: false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`Token validation failed: ${response.status} - ${errorText}`);
      }
      
      const debugData = await response.json();
      const tokenInfo = debugData.data;
      
      console.log('🔐 Token validation result:', { 
        isValid: tokenInfo?.is_valid, 
        appId: tokenInfo?.app_id,
        scopes: tokenInfo?.scopes || [],
        userId: tokenInfo?.user_id,
        issuedAt: tokenInfo?.issued_at,
        expiresAt: tokenInfo?.expires_at
      });

      // Check app compatibility
      const tokenAppId = tokenInfo.app_id;
      const isAppCompatible = tokenAppId === configuredAppId;

      console.log('🔍 App compatibility check:', {
        tokenAppId,
        configuredAppId,
        isCompatible: isAppCompatible
      });

      if (!isAppCompatible) {
        console.warn('⚠️ App ID mismatch detected - token from different app');
      }
      
      // Define required permissions with detailed info
      const permissionRequirements = {
        essential: {
          name: 'Permissões Essenciais',
          scopes: ['ads_management'],
          description: 'Necessárias para gerenciar campanhas publicitárias'
        },
        pages: {
          name: 'Permissões de Páginas',
          scopes: ['pages_read_engagement', 'pages_read_user_content', 'pages_show_list'],
          description: 'Necessárias para acessar suas páginas do Facebook'
        },
        instagram: {
          name: 'Permissões do Instagram',
          scopes: ['instagram_basic', 'instagram_content_publish'],
          description: 'Necessárias para conectar contas do Instagram Business'
        },
        whatsapp: {
          name: 'Permissões do WhatsApp',
          scopes: ['whatsapp_business_management'],
          description: 'Necessárias para acessar WhatsApp Business'
        }
      };
      
      const grantedPermissions = tokenInfo.scopes || [];
      
      // Analyze each permission category
      const permissionAnalysis: any = {};
      const missingCategories: string[] = [];
      const availableCategories: string[] = [];
      
      Object.entries(permissionRequirements).forEach(([category, info]) => {
        const granted = info.scopes.filter(scope => grantedPermissions.includes(scope));
        const missing = info.scopes.filter(scope => !grantedPermissions.includes(scope));
        const hasAll = missing.length === 0;
        const hasAny = granted.length > 0;
        
        permissionAnalysis[category] = {
          name: info.name,
          description: info.description,
          required: info.scopes,
          granted,
          missing,
          hasAll,
          hasAny,
          coverage: Math.round((granted.length / info.scopes.length) * 100)
        };
        
        if (hasAll) {
          availableCategories.push(category);
        } else {
          missingCategories.push(category);
        }
      });
      
      // More lenient permission checking for non-admin users
      const hasBusinessPermissions = grantedPermissions.some((scope: string) => 
        ['business_management', 'ads_management', 'pages_show_list', 'pages_read_engagement'].includes(scope)
      );

      // Determine overall status
      const hasEssentialPermissions = permissionAnalysis.essential.hasAll || hasBusinessPermissions;
      const canAccessPages = permissionAnalysis.pages.hasAny;
      const canAccessInstagram = permissionAnalysis.instagram.hasAny;
      const canAccessWhatsApp = permissionAnalysis.whatsapp.hasAny;
      
      // Generate user-friendly messages
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (!hasEssentialPermissions && !hasBusinessPermissions) {
        issues.push('Permissões essenciais ausentes - não é possível gerenciar campanhas');
        recommendations.push('Reconecte a integração Meta com permissões completas');
      }
      
      if (!canAccessPages) {
        issues.push('Sem acesso às páginas do Facebook');
        recommendations.push('Conceda permissões de páginas para visualizar suas páginas');
      }
      
      if (!canAccessInstagram) {
        issues.push('Sem acesso ao Instagram Business');
        recommendations.push('Conceda permissões do Instagram para conectar perfis');
      }
      
      if (!canAccessWhatsApp) {
        issues.push('Sem acesso ao WhatsApp Business');
        recommendations.push('Adicione números do WhatsApp manualmente ou conceda permissões');
      }
      
      // Override validation for non-admin users with business permissions
      const finalIsValid = tokenInfo.is_valid && (isAppCompatible || hasBusinessPermissions);

      const result = {
        isValid: finalIsValid,
        appId: configuredAppId,
        tokenAppId,
        userId: tokenInfo.user_id,
        grantedPermissions,
        permissionAnalysis,
        hasEssentialPermissions,
        canAccessPages,
        canAccessInstagram,
        canAccessWhatsApp,
        availableCategories,
        missingCategories,
        issues,
        recommendations,
        needsReauthorization: !hasEssentialPermissions && !hasBusinessPermissions,
        // Legacy fields for compatibility
        missingRequired: missingCategories,
        missingOptional: [],
        hasRequiredPermissions: hasEssentialPermissions || hasBusinessPermissions,
        hasInstagramPermissions: canAccessInstagram,
        error: issues.length > 0 && !hasBusinessPermissions ? issues.join('; ') : undefined
      };
      
      console.log('✅ Enhanced permission analysis completed');
      
      // ✅ CACHE: Save result to cache
      setCachedValidation(user.id, result);
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
      
    } catch (error) {
      console.error('Token validation error:', error);
      const errorResult = {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        grantedPermissions: [],
        permissionAnalysis: {},
        hasEssentialPermissions: false,
        canAccessPages: false,
        canAccessInstagram: false,
        canAccessWhatsApp: false,
        availableCategories: [],
        missingCategories: ['essential', 'pages', 'instagram', 'whatsapp'],
        issues: ['Erro ao validar token de acesso'],
        recommendations: ['Verifique sua conexão e tente reconectar a integração Meta'],
        needsReauthorization: true,
        // Legacy fields
        missingRequired: [],
        missingOptional: [],
        hasRequiredPermissions: false,
        hasInstagramPermissions: false
      };

      return new Response(
        JSON.stringify(errorResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 with error info instead of 500
        },
      );
    }

  } catch (error) {
    console.error('Error in meta-validation function:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMsg,
        isValid: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});