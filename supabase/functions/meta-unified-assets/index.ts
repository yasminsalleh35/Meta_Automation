import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { handlePreflight, jsonWithCors } from "../_shared/cors.ts";

const API_VERSION = "v22.0";
const BATCH_TIMEOUT_MS = 20000; // 20 segundos para batch request

// Cache server-side com TTL de 5 minutos
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

interface UnifiedAssetsResponse {
  adAccounts: Array<{
    id: string;
    name: string;
    currency: string;
    status: string;
    permissions: string[];
  }>;
  facebookPages: Array<{
    id: string;
    name: string;
    pictureUrl?: string;
    whatsappNumber?: string;
    whatsappVerifiedName?: string;
  }>;
  instagramAccounts: Array<{
    id: string;
    name: string;
    pageId: string;
    profilePictureUrl?: string;
  }>;
  cached: boolean;
  timestamp: number;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return handlePreflight(req);

  const requestId = crypto.randomUUID();
  console.log(`[meta-unified-assets] ${requestId} - Starting unified fetch`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Auth
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return jsonWithCors(origin, { error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !user) {
      return jsonWithCors(origin, { error: "Invalid token" }, { status: 403 });
    }

    console.log(`[meta-unified-assets] ${requestId} - User: ${user.id}`);

    // Check cache
    const cacheKey = user.id;
    const cached = serverCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[meta-unified-assets] ${requestId} - Returning cached data`);
      return jsonWithCors(origin, { ...cached.data, cached: true });
    }

    // Get active integration
    const { data: integration, error: integError } = await supabase
      .from("integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .single();

    if (integError || !integration?.access_token) {
      const emptyResponse: UnifiedAssetsResponse = {
        adAccounts: [],
        facebookPages: [],
        instagramAccounts: [],
        cached: false,
        timestamp: Date.now()
      };
      return jsonWithCors(origin, emptyResponse);
    }

    const accessToken = integration.access_token;
    console.log(`[meta-unified-assets] ${requestId} - Fetching all assets in parallel`);

    // Fetch all assets in parallel with proper error handling
    const [adAccountsRes, pagesRes] = await Promise.allSettled([
      // Ad Accounts
      fetch(
        `https://graph.facebook.com/${API_VERSION}/me/adaccounts?fields=id,name,currency,account_status,capabilities&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(BATCH_TIMEOUT_MS) }
      ),
      // Pages with Instagram in single batch request
      fetch(
        `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,picture{url},whatsapp_number{display_phone_number,verified_name},instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(BATCH_TIMEOUT_MS) }
      )
    ]);

    // Process Ad Accounts
    const adAccounts = [];
    if (adAccountsRes.status === 'fulfilled' && adAccountsRes.value.ok) {
      const adData = await adAccountsRes.value.json();
      for (const acc of adData.data || []) {
        adAccounts.push({
          id: acc.id,
          name: acc.name,
          currency: acc.currency || 'USD',
          status: acc.account_status === 1 ? 'active' : 'inactive',
          permissions: acc.capabilities || []
        });
      }
      console.log(`[meta-unified-assets] ${requestId} - Ad accounts: ${adAccounts.length}`);
    } else {
      console.warn(`[meta-unified-assets] ${requestId} - Ad accounts fetch failed`);
    }

    // Process Pages and Instagram
    const facebookPages = [];
    const instagramAccounts = [];

    if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
      const pagesData = await pagesRes.value.json();
      
      for (const page of pagesData.data || []) {
        facebookPages.push({
          id: page.id,
          name: page.name,
          pictureUrl: page.picture?.data?.url,
          whatsappNumber: page.whatsapp_number?.display_phone_number,
          whatsappVerifiedName: page.whatsapp_number?.verified_name
        });

        // Instagram from batch
        const ig = page.instagram_business_account;
        if (ig?.id) {
          instagramAccounts.push({
            id: ig.id,
            name: ig.name || ig.username || `Instagram - ${page.name}`,
            pageId: page.id,
            profilePictureUrl: ig.profile_picture_url
          });
        }
      }

      console.log(`[meta-unified-assets] ${requestId} - Pages: ${facebookPages.length}, Instagram: ${instagramAccounts.length}`);
    } else {
      console.warn(`[meta-unified-assets] ${requestId} - Pages fetch failed`);
    }

    const response: UnifiedAssetsResponse = {
      adAccounts,
      facebookPages,
      instagramAccounts,
      cached: false,
      timestamp: Date.now()
    };

    // Cache response
    serverCache.set(cacheKey, { data: response, timestamp: Date.now() });

    console.log(`[meta-unified-assets] ${requestId} - Success: ${adAccounts.length} accounts, ${facebookPages.length} pages, ${instagramAccounts.length} instagram`);

    return jsonWithCors(origin, response);

  } catch (error) {
    console.error(`[meta-unified-assets] ${requestId} - Error:`, error);
    return jsonWithCors(
      origin,
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        adAccounts: [],
        facebookPages: [],
        instagramAccounts: [],
        cached: false,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
});
