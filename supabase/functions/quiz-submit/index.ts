import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { quiz_id, responses, utm_data, device, referrer, consent, consent_at, company }: any = await req.json();

    console.log('📥 Quiz Submit - Received submission', { quiz_id, device });

    // audit LGL-05: honeypot (mesmo padrão de lead-quiz-submit) — responde sucesso para não revelar o filtro
    if (typeof company === 'string' && company.trim() !== '') {
      console.warn('🍯 Quiz Submit - honeypot preenchido, descartando');
      return new Response(
        JSON.stringify({ success: true, message: 'Quiz submitted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // audit LGL-05: consentimento LGPD obrigatório (etapa final do QuizPublic)
    if (consent !== true) {
      return new Response(
        JSON.stringify({ error: 'Consentimento obrigatório para enviar o formulário.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quiz_id || !responses || typeof responses !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prova do consentimento guardada junto às respostas (anonimizada em 2 anos — DATA-07)
    const consentRecord = {
      accepted: true,
      at: typeof consent_at === 'string' ? consent_at : new Date().toISOString(),
      received_at: new Date().toISOString(),
      policy_url: '/legal/privacy',
    };

    // Buscar steps do quiz para calcular pesos
    const { data: steps, error: stepsError } = await supabase
      .from('quiz_steps')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('order_index');

    if (stepsError) {
      throw new Error(`Failed to fetch quiz steps: ${stepsError.message}`);
    }

    // Calcular pesos por categoria
    const weights = {
      urgency: 0,
      budget: 0,
      profile: 0,
      needs: 0
    };

    steps?.forEach((step: any) => {
      if (step.category && responses[step.field_name]) {
        weights[step.category as keyof typeof weights] += step.weight || 1;
      }
    });

    console.log('📊 Calculated weights:', weights);

    // Inserir lead no banco
    const { data: lead, error: leadError } = await supabase
      .from('quiz_leads')
      .insert({
        quiz_id,
        responses: { ...responses, _lgpd_consent: consentRecord },
        lead_name: responses.lead_name || responses.name,
        whatsapp: responses.whatsapp,
        email: responses.email,
        company_name: responses.company_name,
        utm_data: utm_data || {},
        device,
        referrer,
        status: 'novo'
      })
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to insert lead: ${leadError.message}`);
    }

    console.log('✅ Lead created:', lead.id);

    // Chamar função de scoring
    try {
      const scoringResponse = await fetch(
        `${supabaseUrl}/functions/v1/quiz-lead-scoring`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            responses,
            weights,
            quiz_id
          }),
        }
      );

      if (scoringResponse.ok) {
        const scoringData = await scoringResponse.json();
        
        // Atualizar lead com score
        await supabase
          .from('quiz_leads')
          .update({
            score: scoringData.score,
            score_classification: scoringData.classification,
            score_details: scoringData,
            ai_insights: {
              opportunities: scoringData.opportunities,
              risks: scoringData.risks,
              summary: scoringData.summary,
              recommendation: scoringData.recommendation
            }
          })
          .eq('id', lead.id);

        console.log('✅ Lead scored:', { score: scoringData.score, classification: scoringData.classification });
      }
    } catch (scoringError) {
      console.error('⚠️ Scoring failed (non-critical):', scoringError);
      // Continue sem scoring - não é crítico
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: 'Quiz submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Quiz Submit - Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
