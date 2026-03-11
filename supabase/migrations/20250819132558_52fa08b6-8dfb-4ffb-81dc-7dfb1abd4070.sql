-- CRITICAL SECURITY FIXES - Phase 2: Complete Database Function Security
-- Fix remaining functions that still have mutable search_path

-- Update remaining functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_campaign_templates()
 RETURNS TABLE(id uuid, sector_id uuid, title text, description text, objective text, target_audience text, suggested_budget_min numeric, suggested_budget_max numeric, key_messages text[], creative_guidelines text[], best_practices text[], success_metrics text[], is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.sector_id,
    ct.title,
    ct.description,
    ct.objective,
    ct.target_audience,
    ct.suggested_budget_min,
    ct.suggested_budget_max,
    ct.key_messages,
    ct.creative_guidelines,
    ct.best_practices,
    ct.success_metrics,
    ct.is_active,
    ct.created_at,
    ct.updated_at
  FROM public.campaign_templates ct
  ORDER BY ct.title;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sector_category(category_name text, category_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.sector_categories (name, description)
  VALUES (category_name, category_description)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_meta_ads_config()
 RETURNS TABLE(id uuid, app_id text, app_secret text, business_manager_id text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, app_id, app_secret, business_manager_id, created_at, updated_at
  FROM public.meta_ads_config
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.update_sector_category(category_id uuid, category_name text, category_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.sector_categories 
  SET 
    name = category_name,
    description = category_description,
    updated_at = now()
  WHERE id = category_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_sector_category(category_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.sector_categories WHERE id = category_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sector_specialization(p_category_id uuid, p_name text, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.sector_specializations (category_id, name, description)
  VALUES (p_category_id, p_name, p_description)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_subscription_with_plan(user_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(subscriber_id uuid, email text, plan_type text, plan_name text, plan_limits jsonb, plan_features text[], stripe_customer_id text, stripe_subscription_id text, subscription_status text, is_active boolean, created_by_admin boolean, plan_expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    s.id as subscriber_id,
    s.email,
    s.plan_type,
    sp.name as plan_name,
    sp.limits as plan_limits,
    sp.features as plan_features,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.subscription_status,
    s.is_active,
    s.created_by_admin,
    s.plan_expires_at
  FROM public.subscribers s
  LEFT JOIN public.subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.user_id = COALESCE(user_uuid, auth.uid())
  AND sp.is_active = true;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_limit(resource_type_param text, user_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_plan_limits JSONB;
  resource_limit INTEGER;
  current_usage INTEGER;
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Get user's plan limits
  SELECT sp.limits INTO user_plan_limits
  FROM public.subscribers s
  JOIN public.subscription_plans sp ON s.plan_type = sp.plan_type
  WHERE s.user_id = target_user_id AND s.is_active = true;
  
  IF user_plan_limits IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get resource limit (-1 means unlimited)
  resource_limit := (user_plan_limits ->> resource_type_param)::INTEGER;
  
  IF resource_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current usage for this month
  SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
  FROM public.usage_tracking
  WHERE user_id = target_user_id
    AND resource_type = resource_type_param
    AND period_start <= NOW()
    AND period_end >= NOW();
  
  RETURN current_usage < resource_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_usage(resource_type_param text, increment_by integer DEFAULT 1, user_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id UUID;
  current_period_start TIMESTAMPTZ;
  current_period_end TIMESTAMPTZ;
BEGIN
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Define current month period
  current_period_start := date_trunc('month', NOW());
  current_period_end := current_period_start + INTERVAL '1 month' - INTERVAL '1 second';
  
  -- Insert or update usage tracking
  INSERT INTO public.usage_tracking (
    user_id, 
    resource_type, 
    usage_count, 
    period_start, 
    period_end
  )
  VALUES (
    target_user_id,
    resource_type_param,
    increment_by,
    current_period_start,
    current_period_end
  )
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + increment_by,
    updated_at = NOW();
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_meta_ads_config(p_app_id text, p_app_secret text, p_business_manager_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  config_id UUID;
  existing_record RECORD;
BEGIN
  -- Buscar configuração existente
  SELECT * INTO existing_record FROM public.meta_ads_config LIMIT 1;
  
  IF existing_record IS NOT NULL THEN
    -- Atualizar configuração existente usando o ID
    UPDATE public.meta_ads_config 
    SET 
      app_id = p_app_id,
      app_secret = p_app_secret,
      business_manager_id = p_business_manager_id,
      updated_at = now()
    WHERE id = existing_record.id
    RETURNING id INTO config_id;
  ELSE
    -- Inserir nova configuração
    INSERT INTO public.meta_ads_config (app_id, app_secret, business_manager_id)
    VALUES (p_app_id, p_app_secret, p_business_manager_id)
    RETURNING id INTO config_id;
  END IF;
  
  RETURN config_id;
END;
$function$;