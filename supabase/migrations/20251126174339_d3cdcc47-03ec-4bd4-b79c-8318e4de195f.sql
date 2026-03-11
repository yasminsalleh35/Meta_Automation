-- ============================================
-- MÓDULO DE QUIZZES INTELIGENTES - CAMPLY
-- ============================================

-- 1. Tabela de Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  thank_you_config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Steps dos Quizzes
CREATE TABLE IF NOT EXISTS public.quiz_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'checkbox', 'text', 'number', 'slider', 'date', 'select', 'info')),
  title TEXT NOT NULL,
  subtitle TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  field_name TEXT NOT NULL,
  required BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  category TEXT CHECK (category IN ('urgency', 'budget', 'profile', 'needs')),
  validation JSONB DEFAULT '{}'::jsonb,
  conditional JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Leads dos Quizzes
CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  lead_name TEXT,
  whatsapp TEXT,
  email TEXT,
  company_name TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  score_classification TEXT CHECK (score_classification IN ('cold', 'warm', 'hot')),
  score_details JSONB DEFAULT '{}'::jsonb,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  utm_data JSONB DEFAULT '{}'::jsonb,
  device TEXT,
  referrer TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'qualificado', 'contatado', 'frio', 'perdido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON public.quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_steps_quiz_id ON public.quiz_steps(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_quiz_id ON public.quiz_leads(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_status ON public.quiz_leads(status);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON public.quiz_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created_at ON public.quiz_leads(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

-- Quizzes: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Quizzes: Todos podem visualizar quizzes ativos
CREATE POLICY "Anyone can view active quizzes"
  ON public.quizzes
  FOR SELECT
  USING (is_active = true);

-- Quiz Steps: Apenas admins podem gerenciar
CREATE POLICY "Admins can manage quiz steps"
  ON public.quiz_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Quiz Steps: Todos podem visualizar steps de quizzes ativos
CREATE POLICY "Anyone can view active quiz steps"
  ON public.quiz_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_steps.quiz_id
      AND quizzes.is_active = true
    )
  );

-- Quiz Leads: Apenas admins podem visualizar e gerenciar
CREATE POLICY "Admins can manage quiz leads"
  ON public.quiz_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Quiz Leads: Inserção pública permitida (para submissão do quiz)
CREATE POLICY "Anyone can submit quiz leads"
  ON public.quiz_leads
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_steps_updated_at
  BEFORE UPDATE ON public.quiz_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_leads_updated_at
  BEFORE UPDATE ON public.quiz_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED: QUIZ PADRÃO "DIAGNÓSTICO DE ANÚNCIOS"
-- ============================================

-- Inserir quiz padrão
INSERT INTO public.quizzes (name, slug, description, is_active, thank_you_config)
VALUES (
  'Diagnóstico de Anúncios – Camply',
  'diagnostico-anuncios',
  'Descubra como o Camply pode transformar seus anúncios digitais e gerar mais leads qualificados para seu negócio.',
  true,
  '{
    "title": "🎉 Diagnóstico Concluído!",
    "subtitle": "Sua análise está pronta",
    "showScore": true,
    "showEstimates": true,
    "ctaText": "Agendar Sessão Estratégica Camply",
    "ctaUrl": "https://wa.me/5511999999999"
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Inserir steps do quiz padrão
DO $$
DECLARE
  quiz_id_var UUID;
BEGIN
  SELECT id INTO quiz_id_var FROM public.quizzes WHERE slug = 'diagnostico-anuncios';
  
  IF quiz_id_var IS NOT NULL THEN
    INSERT INTO public.quiz_steps (quiz_id, order_index, type, title, subtitle, field_name, required, weight, category, options) VALUES
    (quiz_id_var, 1, 'text', 'Qual é o seu nome completo?', 'Vamos começar nos conhecendo melhor', 'lead_name', true, 1, 'profile', '[]'::jsonb),
    (quiz_id_var, 2, 'text', 'Qual é o seu WhatsApp?', 'Para entrarmos em contato com você', 'whatsapp', true, 1, 'profile', '[]'::jsonb),
    (quiz_id_var, 3, 'text', 'Nome da sua empresa', 'Como sua empresa se chama?', 'company_name', true, 1, 'profile', '[]'::jsonb),
    (quiz_id_var, 4, 'text', 'Instagram da empresa (opcional)', 'Seu perfil no Instagram', 'instagram', false, 1, 'profile', '[]'::jsonb),
    (quiz_id_var, 5, 'select', 'Qual o segmento de atuação?', 'Escolha a categoria que mais se encaixa', 'segment', true, 2, 'profile', 
      '[{"value": "saude", "label": "Saúde e Bem-estar"}, {"value": "educacao", "label": "Educação"}, {"value": "varejo", "label": "Varejo"}, {"value": "servicos", "label": "Serviços"}, {"value": "tecnologia", "label": "Tecnologia"}, {"value": "outro", "label": "Outro"}]'::jsonb),
    
    (quiz_id_var, 6, 'multiple_choice', 'Qual a situação atual com anúncios?', 'Selecione a opção que melhor descreve', 'current_ads_status', true, 3, 'needs',
      '[{"value": "nunca_anunciou", "label": "Nunca anunciei"}, {"value": "ja_anunciei", "label": "Já anunciei mas parei"}, {"value": "anunciando_pouco", "label": "Estou anunciando pouco"}, {"value": "anunciando_muito", "label": "Estou anunciando muito"}]'::jsonb),
    
    (quiz_id_var, 7, 'multiple_choice', 'Quantos leads recebe por dia?', 'Média de contatos diários', 'daily_leads', true, 3, 'needs',
      '[{"value": "0-5", "label": "0 a 5 leads"}, {"value": "6-15", "label": "6 a 15 leads"}, {"value": "16-30", "label": "16 a 30 leads"}, {"value": "30+", "label": "Mais de 30 leads"}]'::jsonb),
    
    (quiz_id_var, 8, 'checkbox', 'Principais desafios', 'Marque todos que se aplicam', 'challenges', true, 3, 'needs',
      '[{"value": "poucos_leads", "label": "Poucos leads"}, {"value": "leads_ruins", "label": "Leads de baixa qualidade"}, {"value": "custo_alto", "label": "Custo por lead muito alto"}, {"value": "nao_sei_anunciar", "label": "Não sei como anunciar"}, {"value": "nao_tenho_tempo", "label": "Não tenho tempo para gerenciar"}]'::jsonb),
    
    (quiz_id_var, 9, 'multiple_choice', 'Quem cria seus anúncios hoje?', 'Situação atual', 'who_creates_ads', true, 2, 'needs',
      '[{"value": "eu_mesmo", "label": "Eu mesmo"}, {"value": "funcionario", "label": "Alguém da equipe"}, {"value": "agencia", "label": "Agência terceirizada"}, {"value": "ninguem", "label": "Ninguém ainda"}]'::jsonb),
    
    (quiz_id_var, 10, 'multiple_choice', 'Tempo médio de resposta aos leads', 'Quanto tempo demora para responder?', 'response_time', true, 2, 'urgency',
      '[{"value": "imediato", "label": "Imediato (até 5min)"}, {"value": "rapido", "label": "Rápido (até 1h)"}, {"value": "moderado", "label": "Moderado (até 4h)"}, {"value": "demorado", "label": "Demorado (mais de 4h)"}]'::jsonb),
    
    (quiz_id_var, 11, 'multiple_choice', 'Horário de atendimento', 'Quando você atende?', 'business_hours', true, 1, 'profile',
      '[{"value": "comercial", "label": "Horário comercial"}, {"value": "estendido", "label": "Até 20h"}, {"value": "noite", "label": "Até 22h"}, {"value": "24h", "label": "24 horas"}]'::jsonb),
    
    (quiz_id_var, 12, 'multiple_choice', 'Tipo de mensagem que mais recebe', 'Como os clientes preferem contato?', 'preferred_contact_method', true, 2, 'needs',
      '[{"value": "whatsapp", "label": "WhatsApp"}, {"value": "direct", "label": "Direct Instagram"}, {"value": "telefone", "label": "Ligação"}, {"value": "email", "label": "E-mail"}]'::jsonb),
    
    (quiz_id_var, 13, 'multiple_choice', 'Objetivo principal', 'O que você mais quer alcançar?', 'main_objective', true, 4, 'urgency',
      '[{"value": "mais_leads", "label": "Gerar mais leads"}, {"value": "leads_qualidade", "label": "Leads de melhor qualidade"}, {"value": "reduzir_custo", "label": "Reduzir custo por lead"}, {"value": "automatizar", "label": "Automatizar gestão de anúncios"}]'::jsonb),
    
    (quiz_id_var, 14, 'multiple_choice', 'Qual a urgência?', 'Quando precisa começar?', 'urgency_level', true, 5, 'urgency',
      '[{"value": "imediato", "label": "Preciso começar agora"}, {"value": "semana", "label": "Nas próximas semanas"}, {"value": "mes", "label": "No próximo mês"}, {"value": "planejando", "label": "Estou só planejando"}]'::jsonb),
    
    (quiz_id_var, 15, 'multiple_choice', 'Quem decide a compra?', 'Estrutura de decisão', 'decision_maker', true, 3, 'budget',
      '[{"value": "eu_decido", "label": "Eu decido sozinho"}, {"value": "consulto", "label": "Consulto alguém"}, {"value": "comite", "label": "Decisão em comitê"}, {"value": "aprovacao", "label": "Precisa de aprovação"}]'::jsonb),
    
    (quiz_id_var, 16, 'multiple_choice', 'Investimento mensal pretendido', 'Quanto pode investir por mês?', 'monthly_budget', true, 4, 'budget',
      '[{"value": "ate_1000", "label": "Até R$ 1.000"}, {"value": "1000_3000", "label": "R$ 1.000 a R$ 3.000"}, {"value": "3000_5000", "label": "R$ 3.000 a R$ 5.000"}, {"value": "5000+", "label": "Mais de R$ 5.000"}]'::jsonb),
    
    (quiz_id_var, 17, 'multiple_choice', 'Melhor horário para contato', 'Quando podemos te ligar?', 'best_contact_time', true, 1, 'profile',
      '[{"value": "manha", "label": "Manhã (8h-12h)"}, {"value": "tarde", "label": "Tarde (12h-18h)"}, {"value": "noite", "label": "Noite (18h-21h)"}, {"value": "qualquer", "label": "Qualquer horário"}]'::jsonb);
  END IF;
END $$;