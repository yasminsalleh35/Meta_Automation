// =============================================
// Edge Function: Create Guest User
// Creates user account after successful payment
// =============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/emailClient.ts';
import { toMessage, toObject } from '../_shared/errors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`🔄 [create-guest-user] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting guest user creation');
    
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const body = await req.json();
    const { 
      email,
      name,
      whatsapp = '',
      plan_type = 'premium',
      billing_period = 'monthly',
      payment_id,
      external_id
    } = body;

    // Validation
    if (!email || !name || !payment_id) {
      throw new Error('Missing required fields: email, name, payment_id');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    logStep('Request validated', { email, name, plan_type, billing_period });

    // Check if user already exists - using listUsers since getUserByEmail doesn't exist
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(user => user.email === email);
    
    if (existingUser) {
      logStep('User already exists', { user_id: existingUser.id });
      
      // Update payment with existing user_id
      await supabaseAdmin
        .from('payments')
        .update({ user_id: existingUser.id })
        .eq('id', payment_id);
      
      return new Response(JSON.stringify({
        success: true,
        user_id: existingUser.id,
        message: 'User already exists, payment linked'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Create new user with temporary password
    const tempPassword = `tmp_${Math.random().toString(36).slice(2)}${Date.now()}`;
    
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        whatsapp: whatsapp || '',
        created_via: 'guest_checkout',
        plan_type: plan_type,
        billing_period: billing_period,
        needs_password_setup: true
      }
    });

    if (createUserError || !newUser.user) {
      logStep('Error creating user', createUserError);
      throw new Error(`Failed to create user: ${createUserError?.message}`);
    }

    logStep('User created successfully', { user_id: newUser.user.id });

    // Update payment with new user_id
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ user_id: newUser.user.id })
      .eq('id', payment_id);

    if (updatePaymentError) {
      logStep('Error updating payment', updatePaymentError);
    }

    // Create profile in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        email: email,
        name: name,
        status: 'active',
        must_change_password: true
      }]);

    if (profileError) {
      logStep('Error creating profile', profileError);
    }

    // Generate password reset token for setup
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL') || ''}.replace('/supabase', '')}/setup-password?from=guest_checkout`
      }
    });

    if (resetError) {
      logStep('Error generating reset link', resetError);
      throw new Error(`Failed to generate setup link: ${resetError.message}`);
    }

    // Send welcome email with password setup link
    try {
      await sendEmail({
        to: [email],
        subject: "🎉 Bem-vindo! Configure sua senha de acesso",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Bem-vindo ao Camply!</h1>
              <p style="color: #666; font-size: 16px;">Seu pagamento foi aprovado com sucesso!</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-bottom: 15px;">Detalhes da sua assinatura:</h2>
              <ul style="color: #475569; line-height: 1.6;">
                <li><strong>Plano:</strong> ${plan_type === 'premium' ? 'Premium' : plan_type}</li>
                <li><strong>Período:</strong> ${billing_period === 'monthly' ? 'Mensal' : 'Anual'}</li>
                <li><strong>Email:</strong> ${email}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetData.properties?.action_link}" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔐 Configurar Minha Senha
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #92400e; margin: 0; text-align: center;">
                <strong>⚠️ Importante:</strong> Configure sua senha nos próximos 24 horas para não perder o acesso.
              </p>
            </div>
            
            <div style="text-align: center; color: #64748b; font-size: 14px; margin-top: 30px;">
              <p>Dúvidas? Entre em contato conosco.</p>
              <p>Equipe Camply</p>
            </div>
          </div>
        `
      });
      
      logStep('Welcome email sent successfully');
    } catch (emailError) {
      logStep('Error sending welcome email', emailError);
      // Don't fail the whole process for email issues
    }

    // Log successful creation
    await supabaseAdmin
      .from('payment_audit_log')
      .insert([{
        source: 'guest_user_creation',
        provider: 'system',
        ref_id: external_id || payment_id,
        message: `Guest user created successfully: ${email}`,
        metadata: { 
          user_id: newUser.user.id,
          email: email,
          plan_type: plan_type,
          billing_period: billing_period
        }
      }]);

    logStep('Guest user creation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      user_id: newUser.user.id,
      message: 'User created and welcome email sent',
      setup_required: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: unknown) {
    logStep('Error in guest user creation', toMessage(err));
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'GUEST_USER_CREATION_ERROR',
        message: toMessage(err)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});