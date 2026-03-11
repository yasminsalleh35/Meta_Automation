// =============================================
// Edge Function: Send Account Creation Email
// Envia email customizado de criação de conta
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendAccountCreationRequest {
  email: string;
  name: string;
  planCode: 'mensal' | 'anual';
  subscriptionId: string;
  provider?: 'pagarme' | 'asaas';
}

function generateAccountCreationEmail(
  name: string,
  resetLink: string,
  planCode: 'mensal' | 'anual',
  subscriptionId: string,
  provider: 'pagarme' | 'asaas' = 'pagarme'
): string {
  const planName = planCode === 'mensal' ? 'Plano Mensal' : 'Plano Anual';
  const amount = planCode === 'mensal' ? 'R$ 349,99/mês' : 'R$ 2.499,00/ano';
  const providerName = provider === 'asaas' ? 'Asaas' : 'Pagar.me';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Crie seu acesso - Camply</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 28px;
            font-weight: 600;
          }
          .header p { 
            margin: 0; 
            font-size: 16px;
            opacity: 0.9;
          }
          .content { 
            padding: 40px 30px;
          }
          .content h2 { 
            color: #1f2937;
            font-size: 22px;
            margin: 0 0 20px 0;
            font-weight: 600;
          }
          .content p { 
            margin: 0 0 16px 0; 
            color: #4b5563;
            font-size: 16px;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
            transition: all 0.2s;
          }
          .button:hover {
            background: #5568d3;
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
          }
          .info-box { 
            margin: 30px 0; 
            padding: 24px; 
            background: #f9fafb; 
            border-left: 4px solid #667eea;
            border-radius: 8px;
          }
          .info-box h3 { 
            margin: 0 0 16px 0; 
            color: #1f2937;
            font-size: 18px;
            font-weight: 600;
          }
          .info-box ul { 
            margin: 0; 
            padding-left: 20px;
            color: #4b5563;
          }
          .info-box li { 
            margin-bottom: 8px;
          }
          .plan-details {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .plan-details p {
            margin: 8px 0;
            color: #1e40af;
          }
          .plan-details strong {
            color: #1e3a8a;
          }
          .footer { 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            padding: 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p { 
            margin: 8px 0;
            color: #6b7280;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 16px;
            margin: 25px 0;
            color: #92400e;
          }
          .warning strong {
            color: #78350f;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo(a), ${name}!</h1>
            <p>Sua assinatura foi confirmada com sucesso</p>
          </div>
          
          <div class="content">
            <h2>Crie seu acesso agora</h2>
            <p>Parabéns! Seu pagamento foi aprovado e sua conta está pronta.</p>
            
            <div class="plan-details">
              <p><strong>✓ Plano Contratado:</strong> ${planName}</p>
              <p><strong>✓ Investimento:</strong> ${amount}</p>
              <p><strong>✓ ID da Assinatura:</strong> ${subscriptionId}</p>
            </div>
            
            <p>Para começar a usar a plataforma, você precisa definir sua senha de acesso:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">
                Criar minha senha de acesso →
              </a>
            </div>
            
            <div class="warning">
              <strong>⏰ Importante:</strong> Este link é válido por 24 horas. Não compartilhe este email com ninguém.
            </div>
            
            <div class="info-box">
              <h3>📋 Próximos passos:</h3>
              <ol>
                <li><strong>Clique no botão acima</strong> para criar sua senha</li>
                <li><strong>Faça login</strong> na plataforma com seu email e senha</li>
                <li><strong>Explore os recursos</strong> e configure sua primeira campanha</li>
                <li><strong>Configure suas preferências</strong> no painel de controle</li>
              </ol>
            </div>
            
            <p style="margin-top: 30px;">Estamos animados para ter você como parte da Camply! Nossa equipe está à disposição para ajudar no que precisar.</p>
            
            <p><strong>Dúvidas?</strong> Responda este email ou entre em contato com nossa equipe de suporte.</p>
          </div>
          
          <div class="footer">
            <p><strong>Camply</strong> - Plataforma de Marketing Digital</p>
            <p>© ${new Date().getFullYear()} Camply - Todos os direitos reservados</p>
            <p>ID da Assinatura: ${subscriptionId}</p>
            <p style="margin-top: 16px;">
              <a href="https://iacamply.com">Acessar plataforma</a> | 
              <a href="mailto:suporte@iacamply.com">Suporte</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SendAccountCreationRequest = await req.json();
    const { email, name, planCode, subscriptionId, provider = 'pagarme' } = body;

    if (!email || !name || !planCode || !subscriptionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: email, name, planCode, subscriptionId' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('[send-account-creation] Creating password reset link for:', email);

    // Gerar link de redefinição de senha (válido por 24h)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://iacamply.com/auth/set-password'
      }
    });

    if (error || !data) {
      console.error('[send-account-creation] Error generating link:', error);
      throw error;
    }

    const resetLink = data.properties?.action_link;
    
    if (!resetLink) {
      throw new Error('No action link generated');
    }

    console.log('[send-account-creation] Sending email via Resend...');

    // Enviar email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailHtml = generateAccountCreationEmail(name, resetLink, planCode, subscriptionId, provider);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Camply <noreply@iacamply.com>',
        to: [email],
        subject: '🎉 Crie seu acesso - Sua conta Camply está pronta!',
        html: emailHtml,
        reply_to: 'suporte@iacamply.com'
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('[send-account-creation] Resend error:', errorData);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorData}`);
    }

    const resendData = await resendResponse.json();
    console.log('[send-account-creation] Email sent successfully:', resendData);

    return new Response(
      JSON.stringify({ 
        success: true,
        email_id: resendData.id 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('[send-account-creation] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send account creation email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
