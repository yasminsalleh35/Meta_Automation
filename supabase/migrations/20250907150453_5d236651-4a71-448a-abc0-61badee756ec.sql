-- Criar tabela leads para o sistema de quiz/captação
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados básicos
  name text,
  clinic_name text,
  specialty text,
  specialties text[] DEFAULT '{}',
  city text,
  state text,
  whatsapp_e164 text,
  email text,
  
  -- Marketing history
  used_paid_traffic text, -- 'never' | 'past' | 'current'
  platforms text[] DEFAULT '{}',
  prev_monthly_spend numeric,
  desired_monthly_spend_range text,
  main_goal text,
  start_timing text,
  expectations text,
  
  -- Contato adicional
  instagram text,
  website text,
  best_contact_time text,
  preferred_channel text,
  notes text,
  
  -- Tracking UTM
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  page_path text,
  device text,
  
  -- CRM fields
  status text DEFAULT 'novo',
  owner_id uuid,
  tags text[] DEFAULT '{}',
  comments jsonb DEFAULT '[]',
  
  -- Respostas brutas do quiz
  answers jsonb NOT NULL DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "leads_select_auth" ON public.leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "leads_insert_service" ON public.leads
  FOR INSERT WITH CHECK (true); -- Edge Function usa service key

CREATE POLICY "leads_update_auth" ON public.leads
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "leads_delete_auth" ON public.leads
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tabela para rate limiting da Edge Function
CREATE TABLE IF NOT EXISTS public.lead_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  submission_count integer DEFAULT 1,
  last_submission timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index para performance no rate limiting
CREATE INDEX IF NOT EXISTS idx_lead_rate_limit_ip ON public.lead_rate_limit(ip_address);
CREATE INDEX IF NOT EXISTS idx_lead_rate_limit_last_submission ON public.lead_rate_limit(last_submission);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();