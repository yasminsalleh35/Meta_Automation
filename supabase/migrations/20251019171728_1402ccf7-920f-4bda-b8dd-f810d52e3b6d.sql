-- Função RPC para incrementar view_count atomicamente
CREATE OR REPLACE FUNCTION public.inc_view_count(p_content uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.learning_contents
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_content;
$$;