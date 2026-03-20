// [CAMPly-FIX-Providers]
// Updated: 2025-10-09 - CORS fix for production preview
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeadersFor, handlePreflight, jsonWithCors } from '../_shared/cors.ts'
import { resolveMetaIntegration } from '../_shared/metaIntegration.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// [CAMPly-FIX-Providers] helpers locais
let globalOrigin: string | null = null;

function jsonOk(body: any, init: number = 200) {
  return jsonWithCors(globalOrigin, body, { status: init });
}
function jsonError(body: any, status = 400) {
  return jsonWithCors(globalOrigin, { error: body }, { status });
}

// Sistema de logs estruturado conforme especificado
function logger(level: "info" | "error" | "warn", stage: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}][simple-campaign-assets][${stage.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      if (data) {
        console.log(`${logPrefix} ${message}`, data);
      } else {
        console.log(`${logPrefix} ${message}`);
      }
      break;
    case 'error':
      if (data) {
        console.error(`${logPrefix} ❌ ${message}`, data);
      } else {
        console.error(`${logPrefix} ❌ ${message}`);
      }
      break;
    case 'warn':
      if (data) {
        console.warn(`${logPrefix} ⚠️ ${message}`, data);
      } else {
        console.warn(`${logPrefix} ⚠️ ${message}`);
      }
      break;
  }
}

// Function to handle Instagram posts fetching with unified integration
async function handleGetInstagramPosts(userId: string, body: any) {
  const { instagram_user_id, page_id } = body;

  // Guard clauses
  if (!instagram_user_id || !page_id) {
    logger('error', 'validation', 'Parâmetros obrigatórios não fornecidos', { instagram_user_id, page_id });
    return jsonError('instagram_user_id e page_id são obrigatórios', 400);
  }

  logger('info', 'startup', 'Iniciando busca de posts do Instagram', { page_id, instagram_user_id });

  try {
    // Buscar integração (provider fixo meta_ads)
    const { data: integ } = await supabase
      .from('integrations')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'meta_ads')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!integ?.access_token) {
      logger('error', 'integration', 'Integração Meta (meta_ads) não encontrada', {
        provider: 'meta_ads',
        has_access_token: false
      });
      return jsonError('Integração Meta (meta_ads) não encontrada para este usuário', 401);
    }
    
    logger('info', 'integration', 'Integração encontrada', { 
      provider: 'meta_ads', 
      has_access_token: !!integ.access_token 
    });

    // Obter informações da página e validar vínculo IG↔Página
    const pageInfoUrl = `https://graph.facebook.com/v23.0/${page_id}?fields=access_token,instagram_business_account{id,username},connected_instagram_account{id,username}&access_token=${integ.access_token}`;
    
    logger('info', 'validation', 'Validando vínculo página-Instagram', { 
      page_id, 
      instagram_user_id,
      api_version: 'v23.0'
    });

    const pageInfoRes = await fetch(pageInfoUrl);
    const pageInfo = await pageInfoRes.json();

    if (!pageInfoRes.ok) {
      const fbtrace_id = pageInfoRes.headers.get('x-fb-trace-id');
      logger('error', 'validation', 'Erro ao obter informações da página', { 
        status: pageInfoRes.status, 
        pageInfo,
        fbtrace_id 
      });
      return jsonError({ error: 'Erro ao validar página', details: pageInfo, fbtrace_id }, pageInfoRes.status);
    }

    const linkedIgId = pageInfo?.instagram_business_account?.id || pageInfo?.connected_instagram_account?.id;
    if (!linkedIgId || linkedIgId !== instagram_user_id) {
      logger('error', 'validation', 'Instagram não vinculado à página', { 
        page_id, 
        instagram_user_id, 
        linkedIgId,
        instagram_business_account: pageInfo?.instagram_business_account?.id,
        connected_instagram_account: pageInfo?.connected_instagram_account?.id
      });
      return jsonError({
        error: 'IG_NAO_VINCULADO',
        hint: 'O Instagram informado não pertence à página selecionada. Conecte o IG à página no Business Manager.',
        details: { page_id, instagram_user_id, linkedIgId }
      }, 400);
    }

    // CORREÇÃO: Usar USER ACCESS TOKEN para listar posts Instagram conforme especificado
    const userAccessToken = integ.access_token;
    if (!userAccessToken) {
      logger('error', 'validation', 'User access token não encontrado');
      return jsonError({
        error: 'USER_TOKEN_MISSING',
        hint: 'Não foi possível obter o user access token. Refaça a conexão e garanta os scopes: instagram_basic, pages_show_list, pages_read_engagement.',
      }, 401);
    }

    logger('info', 'validation', 'Vínculo página-Instagram validado com sucesso', { page_id, instagram_user_id });

    // Reels Support: fetch all post types with pagination
    const afterCursor = body.after || ''; // Pagination cursor from frontend
    const limit = body.limit || 30;
    let mediaEndpoint = `https://graph.facebook.com/v23.0/${instagram_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=${limit}&access_token=${userAccessToken}`;
    if (afterCursor) {
      mediaEndpoint += `&after=${afterCursor}`;
    }

    logger('info', 'media-fetch', 'Buscando posts do Instagram (todos os tipos)', {
      instagram_user_id,
      api_version: 'v23.0',
      token_type: 'user_access_token',
      limit,
      has_cursor: !!afterCursor,
      url_truncated: `/v23.0/${instagram_user_id}/media`
    });

    const mediaRes = await fetch(mediaEndpoint);

    if (!mediaRes.ok) {
      const err = await mediaRes.json().catch(() => ({}));
      const fbtrace_id = mediaRes.headers.get('x-fb-trace-id');

      logger('error', 'media-fetch', 'Erro ao buscar posts do Instagram', {
        status: mediaRes.status,
        error: err,
        fbtrace_id
      });

      // Tratamento específico do erro #10 conforme especificado
      if (err?.error?.code === 10) {
        return jsonError({
          error: 'PERMISSION_DENIED',
          hint: 'Token não tem permissão para acessar posts do Instagram. Verifique: app em modo Live, permissões instagram_basic, pages_show_list, pages_read_engagement, e IG conectado à página. Use user token, não page token.',
          fbtrace_id: err?.error?.fbtrace_id,
          scopes_required: ['instagram_basic', 'pages_show_list', 'pages_read_engagement'],
          token_type_expected: 'user_access_token'
        }, 403);
      }

      return jsonError({
        error: 'META_API_ERROR',
        details: err,
        fbtrace_id
      }, mediaRes.status);
    }

    // Sucesso — include pagination cursor for "Load more"
    const media = await mediaRes.json();
    const nextCursor = media?.paging?.cursors?.after || null;
    const hasNextPage = !!media?.paging?.next;

    logger('info', 'media-fetch', 'Posts do Instagram recuperados com sucesso', {
      quantidade: media?.data?.length || 0,
      has_next_page: hasNextPage,
      fbtrace_id: mediaRes.headers.get('x-fb-trace-id')
    });

    return jsonOk({
      success: true,
      data: media?.data || [],
      pagination: { after: nextCursor, has_next_page: hasNextPage }
    });

  } catch (error) {
    logger('error', 'critical', 'Erro inesperado ao buscar posts do Instagram', error);
    return jsonError({ error: 'Internal error', detail: error instanceof Error ? error.message : String(error) }, 500);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return handlePreflight(req);
  }

  try {
    globalOrigin = origin;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger('error', 'auth', 'Header Authorization não fornecido');
      return jsonWithCors(origin, { error: 'Unauthorized', message: 'Missing Authorization header' }, { status: 401 });
    }
    logger('info', 'startup', 'Iniciando processamento da requisição');

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logger('error', 'auth', 'Token inválido ou expirado', authError);
      return jsonWithCors(origin, { error: 'Invalid or expired token' }, { status: 401 });
    }

    logger('info', 'auth', 'Usuário autenticado com sucesso', { user_id: user.id });

    // Parse request body to check for specific actions
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseError) {
      logger('warn', 'payload', 'Erro ao parsear body da requisição - usando objeto vazio', parseError);
    }
    
    const action = body.action;
    
    logger('info', 'payload', 'Payload parseado', { action, keys: Object.keys(body) });

    // Handle Instagram posts fetching
    if (action === 'get_instagram_posts') {
      return await handleGetInstagramPosts(user.id, body);
    }

    // Use unified integration resolution
    const integration = await resolveMetaIntegration(user.id);
    
    if (!integration) {
      logger('info', 'integration', 'Nenhuma integração Meta ativa encontrada');
      return new Response(
        JSON.stringify({
          facebookPages: [],
          instagramAccounts: [],
          message: 'No active Meta integrations found'
        }),
        { 
          status: 200, 
          headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' }
        }
      );
    }

    logger('info', 'integration', 'Integração encontrada', {
      provider: integration.provider,
      has_access_token: !!integration.access_token,
      ad_account_id: integration.ad_account_id,
      page_id: integration.page_id
    });

    // Process integration to extract assets
    const facebookPages: { id: string; name: string }[] = [];
    const instagramAccounts: { id: string; name: string }[] = [];

    // Extract Facebook pages from page_id or any stored pages data
    if (integration.page_id) {
      facebookPages.push({
        id: integration.page_id,
        name: `Página Principal` // Default name if not available
      });
    }

    logger('info', 'response', 'Preparando resposta', { 
      provider: integration.provider, 
      page_id: integration.page_id, 
      pages_found: facebookPages.length 
    });
    
    const response = {
      facebookPages: facebookPages,
      instagramAccounts: instagramAccounts, // Will be empty for now
      message: `Found ${facebookPages.length} Facebook pages`
    };

    return jsonWithCors(origin, response);

  } catch (error) {
    logger('error', 'critical', 'Erro inesperado na edge function', error);
    return jsonWithCors(origin, { error: 'Internal server error' }, { status: 500 });
  }
})