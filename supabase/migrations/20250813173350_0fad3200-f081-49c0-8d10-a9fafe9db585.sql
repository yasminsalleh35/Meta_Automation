-- Fix database function security by adding proper search_path settings
-- This addresses the Function Search Path Mutable security warnings

-- Fix all functions that are missing secure search_path settings

-- 1. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- 2. Update update_system_settings_updated_at function
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 3. Update update_campaign_jobs_updated_at function
CREATE OR REPLACE FUNCTION public.update_campaign_jobs_updated_at()
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

-- 4. Update update_expected_ad_set_settings_updated_at function
CREATE OR REPLACE FUNCTION public.update_expected_ad_set_settings_updated_at()
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

-- 5. Update create_campaign_job function
CREATE OR REPLACE FUNCTION public.create_campaign_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar job apenas se a campanha não veio com IDs do Meta (nova campanha)
  IF NEW.meta_campaign_id IS NULL THEN
    INSERT INTO public.campaign_jobs (campaign_id, job_type, status)
    VALUES (NEW.id, 'meta_integration', 'pending');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. Update update_code_snapshots_updated_at function
CREATE OR REPLACE FUNCTION public.update_code_snapshots_updated_at()
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

-- 7. Update update_notifications_updated_at function
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
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

-- 8. Update update_sector_categories_updated_at function
CREATE OR REPLACE FUNCTION public.update_sector_categories_updated_at()
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

-- 9. Update update_sector_specializations_updated_at function
CREATE OR REPLACE FUNCTION public.update_sector_specializations_updated_at()
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

-- 10. Update update_campaign_templates_updated_at function
CREATE OR REPLACE FUNCTION public.update_campaign_templates_updated_at()
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

-- 11. Update get_sector_categories_with_specializations function
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

-- 12. Update get_sector_specializations function
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