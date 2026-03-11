-- CRITICAL SECURITY FIXES - Phase 3: Final Functions and Complete Input Security
-- Fix the remaining 7 functions with mutable search_path

CREATE OR REPLACE FUNCTION public.update_sector_specialization(p_id uuid, p_name text, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.sector_specializations 
  SET 
    name = p_name,
    description = p_description,
    updated_at = now()
  WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_sector_specialization(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.sector_specializations WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_campaign_template(p_sector_id uuid, p_title text, p_description text, p_objective text, p_target_audience text, p_suggested_budget_min numeric, p_suggested_budget_max numeric, p_key_messages text[], p_creative_guidelines text[], p_best_practices text[], p_success_metrics text[], p_is_active boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.campaign_templates (
    sector_id, title, description, objective, target_audience,
    suggested_budget_min, suggested_budget_max, key_messages,
    creative_guidelines, best_practices, success_metrics, is_active
  )
  VALUES (
    p_sector_id, p_title, p_description, p_objective, p_target_audience,
    p_suggested_budget_min, p_suggested_budget_max, p_key_messages,
    p_creative_guidelines, p_best_practices, p_success_metrics, p_is_active
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_campaign_template(p_id uuid, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_objective text DEFAULT NULL::text, p_target_audience text DEFAULT NULL::text, p_suggested_budget_min numeric DEFAULT NULL::numeric, p_suggested_budget_max numeric DEFAULT NULL::numeric, p_key_messages text[] DEFAULT NULL::text[], p_creative_guidelines text[] DEFAULT NULL::text[], p_best_practices text[] DEFAULT NULL::text[], p_success_metrics text[] DEFAULT NULL::text[], p_is_active boolean DEFAULT NULL::boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaign_templates 
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    objective = COALESCE(p_objective, objective),
    target_audience = COALESCE(p_target_audience, target_audience),
    suggested_budget_min = COALESCE(p_suggested_budget_min, suggested_budget_min),
    suggested_budget_max = COALESCE(p_suggested_budget_max, suggested_budget_max),
    key_messages = COALESCE(p_key_messages, key_messages),
    creative_guidelines = COALESCE(p_creative_guidelines, creative_guidelines),
    best_practices = COALESCE(p_best_practices, best_practices),
    success_metrics = COALESCE(p_success_metrics, success_metrics),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_campaign_template(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.campaign_templates WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_global_setting(p_setting_key text, p_setting_value jsonb, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  setting_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Upsert the setting
  INSERT INTO public.global_settings (setting_key, setting_value, description)
  VALUES (p_setting_key, p_setting_value, p_description)
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    description = COALESCE(EXCLUDED.description, global_settings.description),
    updated_at = now()
  RETURNING id INTO setting_id;
  
  RETURN setting_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_global_setting(p_setting_key text)
 RETURNS TABLE(setting_value jsonb, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT setting_value, updated_at
  FROM public.global_settings
  WHERE setting_key = p_setting_key;
$function$;

CREATE OR REPLACE FUNCTION public.update_global_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_stripe_config_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the change
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.stripe_config_audit (
      config_id, user_id, action, new_values, created_at
    ) VALUES (
      NEW.id, 
      auth.uid(), 
      'INSERT',
      to_jsonb(NEW) - 'webhook_secret', -- Don't log sensitive data
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.stripe_config_audit (
      config_id, user_id, action, old_values, new_values, created_at
    ) VALUES (
      NEW.id, 
      auth.uid(), 
      'UPDATE',
      to_jsonb(OLD) - 'webhook_secret', -- Don't log sensitive data
      to_jsonb(NEW) - 'webhook_secret', -- Don't log sensitive data
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.stripe_config_audit (
      config_id, user_id, action, old_values, created_at
    ) VALUES (
      OLD.id, 
      auth.uid(), 
      'DELETE',
      to_jsonb(OLD) - 'webhook_secret', -- Don't log sensitive data
      now()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_stripe_config_safe()
 RETURNS TABLE(id uuid, publishable_key text, environment text, created_at timestamp with time zone, updated_at timestamp with time zone, has_webhook_secret boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    sc.id,
    sc.publishable_key,
    sc.environment,
    sc.created_at,
    sc.updated_at,
    (sc.webhook_secret IS NOT NULL AND sc.webhook_secret != '') as has_webhook_secret
  FROM public.stripe_config sc
  WHERE EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_sector_categories_with_specializations()
 RETURNS TABLE(id uuid, name text, description text, specializations json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.description,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', ss.id,
          'category_id', ss.category_id,
          'name', ss.name,
          'description', ss.description
        )
      ) FILTER (WHERE ss.id IS NOT NULL),
      '[]'::JSON
    ) as specializations
  FROM public.sector_categories sc
  LEFT JOIN public.sector_specializations ss ON sc.id = ss.category_id
  GROUP BY sc.id, sc.name, sc.description
  ORDER BY sc.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_sector_specializations()
 RETURNS TABLE(id uuid, category_id uuid, name text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.category_id,
    ss.name,
    ss.description
  FROM public.sector_specializations ss
  ORDER BY ss.name;
END;
$function$;