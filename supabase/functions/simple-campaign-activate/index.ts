import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handlePreflight } from '../_shared/cors.ts';
import { json } from '../_shared/response.ts';
import { createLogger } from '../_shared/logger.ts';
import { toObject } from '../_shared/errors.ts';
import { activateCampaignForUser } from './core.ts';

// audit PLT-06: logs estruturados (respostas via _shared/response.ts, corpo/status inalterados)
const log = createLogger('simple-campaign-activate');

// Version: 7.0.0 - Shared CORS + cascade verification + status tracking (2026-03-15)

serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(origin, { error: 'Token de autorização não fornecido' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      log.error('handler', 'Auth error', { error: toObject(authError) });
      return json(origin, { error: 'Usuário não autenticado' }, 401);
    }

    const input = await req.json().catch(() => ({}));
    const r = await activateCampaignForUser(supabaseClient, user.id, input.campaignId);
    return json(origin, r.body, r.status);
  } catch (error: unknown) {
    log.error('handler', '❌ Unexpected error', { error: toObject(error) });
    return json(origin, { success: false, error: 'Falha ao ativar campanha. Tente novamente ou contate o suporte.' }, 500);
  }
});
