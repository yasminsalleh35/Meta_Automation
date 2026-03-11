// ✅ Implementação nativa do cliente de email sem dependências externas
export interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const from = options.from || Deno.env.get("EMAIL_FROM") || "Camply <noreply@iacamply.com>";
  const replyTo = options.replyTo || Deno.env.get("EMAIL_REPLY_TO") || "suporte@iacamply.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: [replyTo],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

// Compatibilidade com código existente
export const resend = {
  emails: {
    send: sendEmail
  }
};