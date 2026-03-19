// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_API_VERSION = Deno.env.get('META_API_VERSION') ?? 'v23.0';

interface AIConfig {
  provider: 'openai' | 'deepseek';
  api_key: string;
  model_name: string;
}

interface BusinessData {
  business_name: string | null;
  business_description: string | null;
  main_product: string | null;
  category: string | null;
  target_audience: string | null;
  business_goals: string | null;
}

interface GeneratedProfile {
  interests: string[];
  age_min: number;
  age_max: number;
  genders: 'all' | 'male' | 'female';
}

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function resolveInterestName(name: string, accessToken: string): Promise<{ id: string; name: string } | null> {
  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/search?type=adinterest&q=${encodeURIComponent(name)}&limit=1&locale=pt_BR&access_token=${encodeURIComponent(accessToken)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.data?.[0]?.id) {
      return { id: String(data.data[0].id), name: data.data[0].name || name };
    }
    return null;
  } catch {
    return null;
  }
}

async function callAI(config: AIConfig, businessData: BusinessData): Promise<GeneratedProfile> {
  const baseUrl = config.provider === 'deepseek'
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const prompt = `Você é um especialista em Meta Ads e marketing digital.
Com base nas informações do negócio abaixo, gere um perfil de segmentação de público ideal para campanhas Click-to-WhatsApp.

**INFORMAÇÕES DO NEGÓCIO:**
- Nome: ${businessData.business_name || 'Não informado'}
- Descrição: ${businessData.business_description || 'Não informado'}
- Produto/Serviço Principal: ${businessData.main_product || 'Não informado'}
- Categoria: ${businessData.category || 'Não informado'}
- Público-Alvo: ${businessData.target_audience || 'Não informado'}
- Objetivos: ${businessData.business_goals || 'Não informado'}

Retorne SOMENTE um JSON válido (sem markdown, sem texto adicional) com esta estrutura:
{
  "interests": ["interesse1", "interesse2", "interesse3", "interesse4", "interesse5"],
  "age_min": 25,
  "age_max": 55,
  "genders": "all"
}

Regras:
- interests: 5-8 interesses relevantes para o negócio (nomes em português, que existam no Meta Ads)
- age_min: idade mínima do público (entre 18 e 65)
- age_max: idade máxima do público (entre 18 e 65)
- genders: "all", "male" ou "female"`;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      model: config.model_name,
      messages: [
        { role: 'system', content: 'Você retorna apenas JSON válido, sem markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error: ${response.status} - ${err}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error('Empty AI response');

  // Parse JSON — handle markdown code blocks
  let cleaned = content;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  return {
    interests: Array.isArray(parsed.interests) ? parsed.interests.slice(0, 10) : [],
    age_min: Math.max(18, Math.min(65, parsed.age_min || 25)),
    age_max: Math.max(18, Math.min(65, parsed.age_max || 55)),
    genders: ['all', 'male', 'female'].includes(parsed.genders) ? parsed.genders : 'all',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'No authorization header' });

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) return json(401, { error: 'Invalid token' });

    console.log(`[ai-generate-profile] Starting for user ${user.id}`);

    // 2. Fetch business data
    const { data: business, error: bizError } = await supabase
      .from('business_settings')
      .select('business_name, business_description, main_product, category, target_audience, business_goals')
      .eq('user_id', user.id)
      .single();

    if (bizError || !business) {
      return json(400, { error: 'Business settings not found. Fill out Meu Negócio first.' });
    }

    if (!business.business_name && !business.category) {
      return json(400, { error: 'Business name or category is required.' });
    }

    // 3. Get AI config
    const { data: aiConfig, error: aiErr } = await supabase
      .from('ai_configurations')
      .select('provider, api_key, model_name')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (aiErr || !aiConfig?.api_key) {
      return json(500, { error: 'AI not configured. Set up AI in admin settings.' });
    }

    // 4. Generate profile via AI
    console.log('[ai-generate-profile] Calling AI...');
    const generated = await callAI(aiConfig as AIConfig, business);
    console.log('[ai-generate-profile] AI response:', JSON.stringify(generated));

    // 5. Resolve interest names to Meta IDs
    // Get a Meta access token (user's own or system token)
    let metaAccessToken = Deno.env.get('META_SYSTEM_USER_TOKEN') || '';

    if (!metaAccessToken) {
      // Try user's own token
      const { data: integration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'meta_ads')
        .eq('status', 'active')
        .single();
      metaAccessToken = integration?.access_token || '';
    }

    let resolvedInterests: { id: string; name: string }[] = [];
    if (metaAccessToken && generated.interests.length > 0) {
      console.log('[ai-generate-profile] Resolving interest names to Meta IDs...');
      const results = await Promise.all(
        generated.interests.map(name => resolveInterestName(name, metaAccessToken))
      );
      resolvedInterests = results.filter((r): r is { id: string; name: string } => r !== null);
      console.log(`[ai-generate-profile] Resolved ${resolvedInterests.length}/${generated.interests.length} interests`);
    }

    if (resolvedInterests.length < 2) {
      console.warn('[ai-generate-profile] Less than 2 interests resolved, adding generic fallbacks');
      // Generic fallback based on category
      const fallbackSearch = business.category || business.main_product || business.business_name || 'negócios';
      const fallback = await resolveInterestName(fallbackSearch, metaAccessToken);
      if (fallback) resolvedInterests.push(fallback);
    }

    // 6. Upsert campaign profile
    const shortId = user.id.substring(0, 8);
    const profileSlug = `auto-${shortId}`;
    const profileLabel = `Perfil IA - ${business.business_name || 'Meu Negócio'}`;

    // Check if auto-generated profile already exists for this user
    const { data: existing } = await supabase
      .from('campaign_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('is_auto_generated', true)
      .single();

    let profileId: string;

    if (existing) {
      // Update existing
      const { error: updateErr } = await supabase
        .from('campaign_profiles')
        .update({
          label: profileLabel,
          slug: profileSlug,
          age_min: generated.age_min,
          age_max: generated.age_max,
          genders: generated.genders,
          interests: resolvedInterests,
          placements_mode: 'automatic',
          placements: [],
          version: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateErr) throw new Error(`Failed to update profile: ${updateErr.message}`);
      profileId = existing.id;
      console.log(`[ai-generate-profile] Updated existing profile ${profileId}`);
    } else {
      // Insert new
      const { data: newProfile, error: insertErr } = await supabase
        .from('campaign_profiles')
        .insert({
          slug: profileSlug,
          label: profileLabel,
          description: `Perfil gerado automaticamente pela IA com base nas informações de "${business.business_name}"`,
          age_min: generated.age_min,
          age_max: generated.age_max,
          genders: generated.genders,
          interests: resolvedInterests,
          placements_mode: 'automatic',
          placements: [],
          is_active: true,
          is_auto_generated: true,
          owner_user_id: user.id,
          created_by: user.id,
          version: 1,
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(`Failed to create profile: ${insertErr.message}`);
      profileId = newProfile.id;
      console.log(`[ai-generate-profile] Created new profile ${profileId}`);
    }

    // 7. Link profile to business_settings
    await supabase
      .from('business_settings')
      .update({ campaign_profile_id: profileId })
      .eq('user_id', user.id);

    console.log(`[ai-generate-profile] Linked profile ${profileId} to user ${user.id}`);

    return json(200, {
      success: true,
      profile_id: profileId,
      interests_resolved: resolvedInterests.length,
      interests_total: generated.interests.length,
      profile: {
        label: profileLabel,
        age_min: generated.age_min,
        age_max: generated.age_max,
        genders: generated.genders,
        interests: resolvedInterests,
      }
    });

  } catch (error) {
    console.error('[ai-generate-profile] Error:', error);
    return json(500, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
