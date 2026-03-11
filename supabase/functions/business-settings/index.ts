import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    if (req.method === 'GET') {
      // Get business settings
      const { data, error } = await supabaseClient
        .from("business_settings")
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return new Response(JSON.stringify({ settings: data || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (req.method === 'POST') {
      // Save business settings
      const settingsData = await req.json();
      
      const dbSettings = {
        user_id: user.id,
        business_name: settingsData.name,
        business_description: settingsData.description,
        main_product: settingsData.mainProduct,
        category: settingsData.category,
        target_audience: settingsData.targetAudience,
        business_goals: settingsData.businessGoals,
        campaign_profile_id: settingsData.campaign_profile_id ?? null,
        odont_specialties: settingsData.odontSpecialties || [],
        target_age_min: settingsData.targetAgeMin || 18,
        target_age_max: settingsData.targetAgeMax || 65,
        specialty_tickets: settingsData.specialtyTickets || {},
        strategic_notes: settingsData.strategic_notes || null,
        whatsapp_number: settingsData.whatsappNumber || null,
        updated_at: new Date().toISOString()
      };

      console.log('[business-settings] 📤 Saving settings:', {
        userId: user.id,
        hasProfileId: !!dbSettings.campaign_profile_id,
        specialtiesCount: dbSettings.odont_specialties.length,
        ageRange: `${dbSettings.target_age_min}-${dbSettings.target_age_max}`
      });

      const { data, error } = await supabaseClient
        .from("business_settings")
        .upsert(dbSettings, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ 
        success: true, 
        settings: data,
        message: 'Configurações salvas com sucesso!'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });

  } catch (error) {
    console.error('Error with business settings:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});