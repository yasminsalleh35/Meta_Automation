// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveMetaIntegration } from '../_shared/metaIntegration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const API_VERSION = Deno.env.get('META_API_VERSION') ?? 'v23.0';

// Rate limiting - simple in-memory counter
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_5MIN = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

// Circuit breaker - simple in-memory state
const circuitBreaker = { isOpen: false, openUntil: 0, failureCount: 0 };
const MAX_FAILURES = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60 * 1000; // 1 minute

// Simple cache - 2 minute TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface BusinessNode {
  id: string;
  name: string;
  wabas: WabaNode[];
}

interface WabaNode {
  id: string;
  name: string;
  phone_numbers: PhoneNode[];
}

interface PhoneNode {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function logError(prefix: string, error: any) {
  console.error(`${prefix} ERROR:`, error instanceof Error ? error.message : error);
  if (error?.response?.data?.error?.fbtrace_id) {
    console.error(`${prefix} FB_TRACE_ID:`, error.response.data.error.fbtrace_id);
  }
}

function logInfo(prefix: string, message: string, data?: any) {
  console.log(`${prefix} ${message}`, data || '');
}

async function assertAuthedUser(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_5MIN) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  if (circuitBreaker.isOpen && now < circuitBreaker.openUntil) {
    return false; // Circuit is open
  }
  
  if (circuitBreaker.isOpen && now >= circuitBreaker.openUntil) {
    // Reset circuit breaker
    circuitBreaker.isOpen = false;
    circuitBreaker.failureCount = 0;
    logInfo('[meta-whatsapp-assets]', 'Circuit breaker reset');
  }
  
  return true;
}

function recordFailure() {
  circuitBreaker.failureCount++;
  if (circuitBreaker.failureCount >= MAX_FAILURES) {
    circuitBreaker.isOpen = true;
    circuitBreaker.openUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
    logInfo('[meta-whatsapp-assets]', `Circuit breaker opened for ${CIRCUIT_BREAKER_TIMEOUT/1000}s`);
  }
}

function recordSuccess() {
  circuitBreaker.failureCount = 0;
}

async function fetchFromGraph(path: string, accessToken: string) {
  const url = `https://graph.facebook.com/${API_VERSION}${path}`;
  const fullUrl = url.includes('?') ? `${url}&access_token=${accessToken}` : `${url}?access_token=${accessToken}`;
  
  const response = await fetch(fullUrl);
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(`Graph API error: ${data.error?.message || 'Unknown error'}`);
    (error as any).fbTraceId = data.error?.fbtrace_id;
    throw error;
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const user = await assertAuthedUser(req);
    
    // Rate limiting
    if (!checkRateLimit(user.id)) {
      logInfo('[meta-whatsapp-assets]', `Rate limit exceeded for user ${user.id}`);
      return json(429, { error: 'Rate limit exceeded. Try again in 5 minutes.' });
    }
    
    // Circuit breaker
    if (!checkCircuitBreaker()) {
      logInfo('[meta-whatsapp-assets]', 'Circuit breaker is open');
      return json(503, { error: 'Service temporarily unavailable. Please try again later.' });
    }
    
    // Check cache
    const cacheKey = `whatsapp-assets-${user.id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      logInfo('[meta-whatsapp-assets]', 'Returning cached data');
      return json(200, cached.data);
    }

    const integration = await resolveMetaIntegration(user.id);
    if (!integration?.access_token) {
      logInfo('[meta-whatsapp-assets]', 'No active Meta integration found');
      return json(401, { error: 'No active Meta integration' });
    }

    logInfo('[meta-whatsapp-assets]', '[INTEGRATION-FOUND]', { provider: integration.provider });

    const accessToken = integration.access_token;
    const businesses: BusinessNode[] = [];

    try {
      // 1) Fetch businesses
      const bizResponse = await fetchFromGraph('/me/businesses?fields=id,name', accessToken);
      const bizList = bizResponse.data ?? [];
      
      logInfo('[meta-whatsapp-assets]', '[BUSINESSES]', `count=${bizList.length}`);

      // 2) For each business, get WABAs
      for (const biz of bizList) {
        try {
          const wabasResponse = await fetchFromGraph(
            `/${biz.id}/owned_whatsapp_business_accounts?fields=id,name`, 
            accessToken
          );
          const wabasList = wabasResponse.data ?? [];
          
          logInfo('[meta-whatsapp-assets]', '[WABAS]', `business=${biz.id} count=${wabasList.length}`);

          const wabasProcessed: WabaNode[] = [];
          
          // 3) For each WABA, get phone numbers
          for (const waba of wabasList) {
            try {
              const phonesResponse = await fetchFromGraph(
                `/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name`, 
                accessToken
              );
              const phonesList = phonesResponse.data ?? [];
              
              logInfo('[meta-whatsapp-assets]', '[PHONES]', `waba=${waba.id} count=${phonesList.length}`);

              wabasProcessed.push({
                id: waba.id,
                name: waba.name,
                phone_numbers: phonesList.map((phone: any) => ({
                  id: phone.id,
                  display_phone_number: phone.display_phone_number || '',
                  verified_name: phone.verified_name || ''
                }))
              });
            } catch (phoneError) {
              logError('[meta-whatsapp-assets]', `Error fetching phones for WABA ${waba.id}: ${phoneError}`);
              // Add WABA without phones
              wabasProcessed.push({
                id: waba.id,
                name: waba.name,
                phone_numbers: []
              });
            }
          }

          businesses.push({
            id: biz.id,
            name: biz.name,
            wabas: wabasProcessed
          });
        } catch (wabaError) {
          logError('[meta-whatsapp-assets]', `Error fetching WABAs for business ${biz.id}: ${wabaError}`);
          // Add business without WABAs
          businesses.push({
            id: biz.id,
            name: biz.name,
            wabas: []
          });
        }
      }

      recordSuccess();
      
      const result = { businesses };
      
      // Cache the result
      cache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });
      
      return json(200, result);

    } catch (apiError) {
      recordFailure();
      logError('[meta-whatsapp-assets]', `Graph API error: ${apiError}`);
      
      if ((apiError as any).fbTraceId) {
        logError('[meta-whatsapp-assets]', `FB_TRACE_ID: ${(apiError as any).fbTraceId}`);
      }
      
      return json(500, { 
        error: 'WhatsApp discovery failed', 
        details: apiError instanceof Error ? apiError.message : String(apiError),
        fb_trace_id: (apiError as any).fbTraceId
      });
    }

  } catch (error) {
    logError('[meta-whatsapp-assets]', error);
    return json(500, { 
      error: 'WhatsApp discovery failed', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});