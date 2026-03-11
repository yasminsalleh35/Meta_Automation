import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { handlePreflight, jsonWithCors } from "../_shared/cors.ts";
import { assertRateLimit } from "../_shared/rateLimit.ts";

const API_VERSION = Deno.env.get("META_API_VERSION") ?? "v22.0"; // ✅ PHASE 4: Updated to latest stable version

// Cache global para assets com TTL de 5 minutos
const assetsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Rate limiting específico por usuário
const userRateLimit = new Map<string, { count: number; resetTime: number; backoffLevel: number }>();

// Função para obter cache
function getCachedAssets(userId: string): any | null {
  const cached = assetsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    console.log(`[meta-dynamic-assets] Cache hit for user ${userId}`);
    return cached.data;
  }
  return null;
}

// Função para salvar cache  
function setCachedAssets(userId: string, data: any): void {
  assetsCache.set(userId, { data, timestamp: Date.now() });
  console.log(`[meta-dynamic-assets] Cache set for user ${userId}`);
}

// Backoff exponencial
function getBackoffDelay(level: number): number {
  return Math.min(1000 * Math.pow(2, level), 30000); // Max 30s
}

// Rate limit por usuário
function checkUserRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = userRateLimit.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset ou primeira vez
    userRateLimit.set(userId, { count: 1, resetTime: now + 60000, backoffLevel: 0 });
    return { allowed: true };
  }
  
  if (userLimit.count >= 3) { // Máximo 3 requests por minuto por usuário
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  userLimit.count++;
  return { allowed: true };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return handlePreflight(req);

  const requestId = crypto.randomUUID();
  console.log(`[meta-dynamic-assets] Request ${requestId} received`);

  // Rate limit global da API
  const rateLimitResult = assertRateLimit(req, {
    key: 'meta-dynamic-assets-global',
    limit: 10,
    window: 60
  });
  
  if (rateLimitResult) return rateLimitResult;

  try {
    // Supabase clients
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Enhanced auth validation with detailed logging
    const auth = req.headers.get("Authorization");
    console.log('[meta-dynamic-assets] Auth header present:', !!auth);
    console.log('[meta-dynamic-assets] Request method:', req.method);
    console.log('[meta-dynamic-assets] Request URL:', req.url);
    
    if (!auth || !auth.startsWith("Bearer ")) {
      console.log('[meta-dynamic-assets] Missing or malformed auth header');
      return jsonWithCors(origin, { error: "Unauthorized: Missing or malformed auth header" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    console.log('[meta-dynamic-assets] Token length:', token.length);
    console.log('[meta-dynamic-assets] Token preview:', token.substring(0, 10) + '...');
    
    // Use admin client for user validation to avoid permission issues
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr) {
      console.error('[meta-dynamic-assets] Auth error:', userErr);
      return jsonWithCors(origin, { error: "Authentication failed: " + userErr.message }, { status: 403 });
    }
    
    if (!user) {
      console.log('[meta-dynamic-assets] No user found for token');
      return jsonWithCors(origin, { error: "Invalid token: User not found" }, { status: 403 });
    }

    console.log(`[meta-dynamic-assets] Request ${requestId} - User authenticated:`, user.id);

    // Verificar rate limit por usuário
    const userRateLimitCheck = checkUserRateLimit(user.id);
    if (!userRateLimitCheck.allowed) {
      console.log(`[meta-dynamic-assets] Request ${requestId} - User rate limited:`, user.id);
      return jsonWithCors(origin, {
        facebookPages: [],
        instagramAccounts: [],
        error: "Too many requests. Please wait before trying again.",
        retryAfter: userRateLimitCheck.retryAfter
      }, { 
        status: 429,
        headers: { 'Retry-After': userRateLimitCheck.retryAfter?.toString() || '60' }
      });
    }

    // Verificar cache primeiro
    const cachedData = getCachedAssets(user.id);
    if (cachedData) {
      console.log(`[meta-dynamic-assets] Request ${requestId} - Returning cached data for user:`, user.id);
      return jsonWithCors(origin, cachedData);
    }

    // Integração ativa
    console.log(`[meta-dynamic-assets] Request ${requestId} - Fetching integration for user:`, user.id);
    
    const { data: integ, error: integError } = await admin
      .from("integrations")
      .select("access_token, provider, status")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (integError) {
      console.error('[meta-dynamic-assets] Integration query error:', integError);
      return jsonWithCors(origin, {
        facebookPages: [],
        instagramAccounts: [],
        error: "Database error: " + integError.message,
      }, { status: 500 });
    }

    if (!integ?.access_token) {
      console.log(`[meta-dynamic-assets] Request ${requestId} - No active integration found`);
      const noIntegrationResponse = {
        facebookPages: [],
        instagramAccounts: [],
        message: "No active Meta integration found",
      };
      setCachedAssets(user.id, noIntegrationResponse); // Cache empty response
      return jsonWithCors(origin, noIntegrationResponse);
    }

    console.log(`[meta-dynamic-assets] Request ${requestId} - Active integration found`);

    const accessToken = integ.access_token;

    // ✅ PHASE 1: Validate token permissions
    try {
      const permsRes = await fetch(
        `https://graph.facebook.com/${API_VERSION}/me/permissions?access_token=${accessToken}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        const relevantPerms = permsData.data?.filter((p: any) => 
          ['whatsapp_business_management', 'pages_read_engagement', 'pages_manage_metadata', 'pages_messaging'].includes(p.permission)
        );
        console.log('[meta-dynamic-assets] 🔐 WhatsApp-related permissions:', relevantPerms);
      }
    } catch (permErr) {
      console.warn('[meta-dynamic-assets] Failed to check permissions:', permErr);
    }

    // Pages
    console.log(`[meta-dynamic-assets] Request ${requestId} - Fetching Facebook pages...`);
    
    try {
      // ✅ PHASE 2: Simplified query (testing without nested fields)
      const pagesRes = await fetch(
        `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,picture{url},whatsapp_number&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(15000) },
      );
      
      if (!pagesRes.ok) {
        console.error(`[meta-dynamic-assets] Request ${requestId} - Pages fetch failed:`, pagesRes.status, pagesRes.statusText);
        const err = await pagesRes.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`[meta-dynamic-assets] Request ${requestId} - Pages error details:`, err);
        
        // Handle rate limiting with exponential backoff
        if (pagesRes.status === 429 || (err.error && (err.error.code === 4 || err.error.code === 80004))) {
          const userLimit = userRateLimit.get(user.id);
          if (userLimit) {
            userLimit.backoffLevel = Math.min(userLimit.backoffLevel + 1, 5);
            const backoffDelay = getBackoffDelay(userLimit.backoffLevel);
            console.log(`[meta-dynamic-assets] Request ${requestId} - Rate limited, backoff level ${userLimit.backoffLevel}, delay ${backoffDelay}ms`);
          }
          
          return jsonWithCors(
            origin,
            { 
              facebookPages: [], 
              instagramAccounts: [], 
              error: "Rate limit reached. Please wait before trying again.",
              retryAfter: 300,
              backoffLevel: userLimit?.backoffLevel || 1
            },
            { 
              status: 429,
              headers: { 'Retry-After': '300' }
            }
          );
        }
        
        const errorResponse = { 
          facebookPages: [], 
          instagramAccounts: [], 
          error: "Failed to fetch pages: " + (err.error?.message || 'Unknown error'), 
          details: err 
        };
        
        // Cache error response for shorter time (1 minute)
        assetsCache.set(user.id, { data: errorResponse, timestamp: Date.now() - (CACHE_TTL_MS - 60000) });
        
        return jsonWithCors(origin, errorResponse, { status: pagesRes.status });
      }
    
    const pagesData = await pagesRes.json();
    console.log('[meta-dynamic-assets] Pages fetched:', pagesData?.data?.length || 0);

    // Build assets
    const facebookPages: Array<{ id: string; name: string; pictureUrl?: string; whatsappNumber?: string; whatsappVerifiedName?: string }> = [];
    const instagramAccounts: Array<{ id: string; name: string; pageId: string; profilePictureUrl?: string }> = [];

    // ✅ FASE 1 OTIMIZAÇÃO: Batch request para Instagram e WhatsApp
    if (pagesData.data && pagesData.data.length > 0) {
      const pageIds = pagesData.data.map((p: any) => p.id).join(',');
      
      console.log('[meta-dynamic-assets] 🚀 BATCH REQUEST para Instagram de todas as páginas:', pageIds);
      
      try {
        // Batch request com timeout maior para múltiplas páginas
        const batchRes = await fetch(
          `https://graph.facebook.com/${API_VERSION}?ids=${pageIds}&fields=id,name,picture{url},whatsapp_number{display_phone_number,verified_name},instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(20000) }
        );

        if (batchRes.ok) {
          const batchData = await batchRes.json();
          console.log('[meta-dynamic-assets] ✅ Batch response recebido para', Object.keys(batchData).length, 'páginas');

          // Processar dados do batch
          for (const p of pagesData.data) {
            const pageData = batchData[p.id];
            
            if (pageData) {
              // Adicionar página com dados do batch
              facebookPages.push({
                id: pageData.id,
                name: pageData.name,
                pictureUrl: pageData.picture?.data?.url,
                whatsappNumber: pageData.whatsapp_number?.display_phone_number,
                whatsappVerifiedName: pageData.whatsapp_number?.verified_name
              });

              // Adicionar Instagram se existir
              const ig = pageData.instagram_business_account;
              if (ig?.id) {
                instagramAccounts.push({
                  id: ig.id,
                  name: ig.name || ig.username || `Instagram - ${pageData.name}`,
                  pageId: pageData.id,
                  profilePictureUrl: ig.profile_picture_url,
                });
              }
            } else {
              // Fallback: adicionar página com dados básicos
              facebookPages.push({
                id: p.id,
                name: p.name,
                pictureUrl: p.picture?.data?.url,
                whatsappNumber: p.whatsapp_number?.display_phone_number,
                whatsappVerifiedName: p.whatsapp_number?.verified_name
              });
            }
          }

          console.log('[meta-dynamic-assets] 📊 Batch processing concluído:', {
            totalPages: facebookPages.length,
            withInstagram: instagramAccounts.length,
            withWhatsApp: facebookPages.filter(p => p.whatsappNumber).length
          });
        } else {
          console.warn('[meta-dynamic-assets] ⚠️ Batch request falhou, usando fallback individual');
          // Fallback para processamento individual (código antigo simplificado)
          for (const p of pagesData.data) {
            facebookPages.push({
              id: p.id,
              name: p.name,
              pictureUrl: p.picture?.data?.url,
              whatsappNumber: p.whatsapp_number?.display_phone_number,
              whatsappVerifiedName: p.whatsapp_number?.verified_name
            });
          }
        }
      } catch (batchErr) {
        console.error('[meta-dynamic-assets] ❌ Erro no batch request:', batchErr);
        // Fallback: processar apenas dados básicos
        for (const p of pagesData.data) {
          facebookPages.push({
            id: p.id,
            name: p.name,
            pictureUrl: p.picture?.data?.url,
            whatsappNumber: p.whatsapp_number?.display_phone_number,
            whatsappVerifiedName: p.whatsapp_number?.verified_name
          });
        }
      }
    }

      console.log('[meta-dynamic-assets] 📊 FINAL RESPONSE STATS:', {
        totalPages: facebookPages.length,
        pagesWithWhatsApp: facebookPages.filter(p => p.whatsappNumber).length,
        totalInstagram: instagramAccounts.length,
        whatsappDetails: facebookPages.map(p => ({ 
          pageId: p.id, 
          pageName: p.name,
          hasWhatsApp: !!p.whatsappNumber,
          whatsappNumber: p.whatsappNumber,
          whatsappVerifiedName: p.whatsappVerifiedName
        }))
      });

      const responseData = {
        facebookPages,
        instagramAccounts,
        message: `Found ${facebookPages.length} pages and ${instagramAccounts.length} instagram accounts`,
        totalPages: facebookPages.length,
        totalInstagram: instagramAccounts.length,
        cached: false,
        requestId
      };

      // Cache successful response
      setCachedAssets(user.id, responseData);

      // Reset backoff level on success
      const userLimit = userRateLimit.get(user.id);
      if (userLimit) {
        userLimit.backoffLevel = 0;
      }

      // Atualiza cache leve na integração (opcional)
      await admin
        .from("integrations")
        .update({ selected_pages: pagesData.data ?? [], updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("provider", "meta_ads")
        .eq("status", "active");

      console.log(`[meta-dynamic-assets] Request ${requestId} - Success:`, {
        pages: facebookPages.length,
        instagram: instagramAccounts.length
      });

      return jsonWithCors(origin, responseData);
    } catch (fetchError) {
      console.error(`[meta-dynamic-assets] Request ${requestId} - Fetch error:`, fetchError);
      throw fetchError;
    }
  } catch (e) {
    console.error(`[meta-dynamic-assets] Request ${requestId || 'unknown'} - Unexpected error:`, e);
    const errorResponse = { 
      error: "Internal server error", 
      message: e instanceof Error ? e.message : String(e),
      facebookPages: [],
      instagramAccounts: [],
      requestId: requestId || 'unknown'
    };
    
    return jsonWithCors(origin, errorResponse, { status: 500 });
  }
});