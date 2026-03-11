
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  email: string;
  name: string;
  planName: string;
  amount: string;
  subscriptionEnd?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, planName, amount, subscriptionEnd }: PaymentConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Camply <noreply@camply.com.br>",
      to: [email],
      subject: "🎉 Pagamento confirmado - Bem-vindo ao Camply!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Confirmado - Camply</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Bem-vindo ao Camply</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Olá, ${name}!</h2>
            
            <p>Seu pagamento foi processado com sucesso e sua assinatura do Camply está ativa! 🚀</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Detalhes da Assinatura:</h3>
              <p><strong>Plano:</strong> ${planName}</p>
              <p><strong>Valor:</strong> ${amount}</p>
              ${subscriptionEnd ? `<p><strong>Próxima renovação:</strong> ${new Date(subscriptionEnd).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
            
            <h3 style="color: #333;">O que você pode fazer agora:</h3>
            <ul style="padding-left: 20px;">
              <li>✅ Criar campanhas ilimitadas no Meta Ads</li>
              <li>🤖 Usar nossa IA especializada em anúncios</li>
              <li>📊 Acessar relatórios e análises avançadas</li>
              <li>🎯 Otimizar suas campanhas automaticamente</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${req.headers.get("origin") || "https://camply.com.br"}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Acessar Dashboard
              </a>
            </div>
            
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                <strong>Precisa de ajuda?</strong><br>
                Nossa equipe está sempre disponível para ajudar você a ter sucesso com seus anúncios.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p>© 2024 Camply. Todos os direitos reservados.</p>
            <p>Anúncios no Meta com Inteligência Artificial</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Payment confirmation email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending payment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
