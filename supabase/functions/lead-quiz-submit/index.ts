import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface QuizSubmission {
  name: string;
  clinic_name: string;
  specialty: string;
  specialties?: string[];
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  used_paid_traffic: "never" | "past" | "current";
  platforms?: string[];
  prev_monthly_spend?: number;
  desired_monthly_spend_range: string;
  main_goal: string;
  start_timing: string;
  expectations?: string;
  instagram?: string;
  website?: string;
  best_contact_time?: string;
  preferred_channel?: string;
  notes?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer?: string;
  page_path?: string;
  device?: string;
  answers: any;
  company?: string; // honeypot field
}

const handler = async (req: Request): Promise<Response> => {
  console.log("📩 Quiz submission received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || "unknown";

    console.log(`🔍 Processing submission from IP: ${clientIP}`);

    // Rate limiting check - max 5 submissions per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from("lead_rate_limit")
      .select("submission_count")
      .eq("ip_address", clientIP)
      .gt("last_submission", oneHourAgo)
      .maybeSingle();

    if (rateLimitError) {
      console.error("❌ Rate limit check error:", rateLimitError);
    }

    if (rateLimitData && rateLimitData.submission_count >= 5) {
      console.log("🚫 Rate limit exceeded for IP:", clientIP);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const submission: QuizSubmission = await req.json();
    console.log("📝 Parsed submission data");

    // Honeypot check - if company field is filled, it's spam
    if (submission.company && submission.company.trim() !== "") {
      console.log("🍯 Honeypot triggered, discarding spam");
      // Return success to not reveal honeypot
      return new Response(JSON.stringify({ success: true, leadId: "spam" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize WhatsApp to E.164 format
    let whatsappE164 = submission.whatsapp;
    if (whatsappE164) {
      // Remove all non-digits
      const digits = whatsappE164.replace(/\D/g, "");
      
      // Add +55 if it's a Brazilian number without country code
      if (digits.length === 11 && digits.startsWith("11")) {
        whatsappE164 = `+55${digits}`;
      } else if (digits.length === 10) {
        whatsappE164 = `+55${digits}`;
      } else if (digits.length === 13 && digits.startsWith("55")) {
        whatsappE164 = `+${digits}`;
      } else {
        whatsappE164 = `+${digits}`;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (submission.email && !emailRegex.test(submission.email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert lead data
    const leadData = {
      name: submission.name,
      clinic_name: submission.clinic_name,
      specialty: submission.specialty,
      specialties: submission.specialties || [],
      city: submission.city,
      state: submission.state,
      whatsapp_e164: whatsappE164,
      email: submission.email,
      used_paid_traffic: submission.used_paid_traffic,
      platforms: submission.platforms || [],
      prev_monthly_spend: submission.prev_monthly_spend,
      desired_monthly_spend_range: submission.desired_monthly_spend_range,
      main_goal: submission.main_goal,
      start_timing: submission.start_timing,
      expectations: submission.expectations,
      instagram: submission.instagram,
      website: submission.website,
      best_contact_time: submission.best_contact_time,
      preferred_channel: submission.preferred_channel,
      notes: submission.notes,
      utm_source: submission.utm?.source,
      utm_medium: submission.utm?.medium,
      utm_campaign: submission.utm?.campaign,
      utm_term: submission.utm?.term,
      utm_content: submission.utm?.content,
      referrer: submission.referrer,
      page_path: submission.page_path,
      device: submission.device,
      answers: submission.answers,
      status: "novo",
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select("id")
      .single();

    if (leadError) {
      console.error("❌ Error inserting lead:", leadError);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Lead saved successfully:", lead.id);

    // Update rate limiting counter
    await supabase
      .from("lead_rate_limit")
      .upsert({
        ip_address: clientIP,
        submission_count: (rateLimitData?.submission_count || 0) + 1,
        last_submission: new Date().toISOString(),
      }, {
        onConflict: "ip_address",
      });

    return new Response(JSON.stringify({ 
      success: true, 
      leadId: lead.id,
      message: "Quiz submitted successfully!" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: "Something went wrong. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);