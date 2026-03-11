
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { EmailConfirmationTemplate } from "./_templates/email-confirmation.tsx";
import { sendEmail } from "../_shared/emailClient.ts";
import { assertRateLimit } from "../_shared/rateLimit.ts";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailConfirmationRequest {
  email: string;
  name: string;
  confirmationUrl: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting for public email endpoint
  const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResponse = assertRateLimit(req, {
    key: `email:${clientIP}`,
    limit: 10,
    window: 60
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { email, name, confirmationUrl, token }: EmailConfirmationRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    // Renderizar o template do email
    const emailHtml = await renderAsync(
      React.createElement(EmailConfirmationTemplate, {
        userName: name,
        confirmationUrl,
        token
      })
    );

    const emailResponse = await sendEmail({
      to: [email],
      subject: "Confirme sua conta na Camply",
      html: emailHtml,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de confirmação:", error);
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
