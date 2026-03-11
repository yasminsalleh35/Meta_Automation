-- Criar função segura para administradores acessarem leads

CREATE OR REPLACE FUNCTION public.get_leads_admin_safe()
RETURNS TABLE(
  id uuid,
  name text,
  clinic_name text,
  specialty text,
  specialties text[],
  city text,
  state text,
  whatsapp_e164 text,
  email text,
  used_paid_traffic text,
  platforms text[],
  desired_monthly_spend_range text,
  main_goal text,
  start_timing text,
  expectations text,
  instagram text,
  website text,
  best_contact_time text,
  preferred_channel text,
  notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  page_path text,
  device text,
  status text,
  tags text[],
  owner_id uuid,
  comments jsonb,
  answers jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  -- Apenas permite administradores chamar esta função
  SELECT 
    l.id,
    l.name,
    l.clinic_name,
    l.specialty,
    l.specialties,
    l.city,
    l.state,
    l.whatsapp_e164,
    l.email,
    l.used_paid_traffic,
    l.platforms,
    l.desired_monthly_spend_range,
    l.main_goal,
    l.start_timing,
    l.expectations,
    l.instagram,
    l.website,
    l.best_contact_time,
    l.preferred_channel,
    l.notes,
    l.utm_source,
    l.utm_medium,
    l.utm_campaign,
    l.utm_term,
    l.utm_content,
    l.referrer,
    l.page_path,
    l.device,
    l.status,
    l.tags,
    l.owner_id,
    l.comments,
    l.answers,
    l.created_at,
    l.updated_at
  FROM public.leads l
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  ORDER BY l.created_at DESC;
$function$;

-- Criar função para atualizar leads (admin only)
CREATE OR REPLACE FUNCTION public.update_lead_admin_safe(
  p_lead_id uuid,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ) THEN
    RETURN false;
  END IF;

  -- Atualizar o lead
  UPDATE public.leads 
  SET 
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    tags = COALESCE(p_tags, tags),
    owner_id = COALESCE(p_owner_id, owner_id),
    updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN true;
END;
$function$;

-- Criar função para adicionar comentários
CREATE OR REPLACE FUNCTION public.add_lead_comment_admin_safe(
  p_lead_id uuid,
  p_comment text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_comment jsonb;
  admin_name text;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ) THEN
    RETURN false;
  END IF;

  -- Pegar nome do admin
  SELECT name INTO admin_name FROM public.profiles WHERE id = auth.uid();

  -- Criar novo comentário
  new_comment := jsonb_build_object(
    'id', gen_random_uuid(),
    'author_id', auth.uid(),
    'author_name', COALESCE(admin_name, 'Admin'),
    'text', p_comment,
    'created_at', now()
  );

  -- Adicionar comentário ao array
  UPDATE public.leads 
  SET 
    comments = COALESCE(comments, '[]'::jsonb) || new_comment,
    updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN true;
END;
$function$;