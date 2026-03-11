-- Limpar planos existentes
DELETE FROM public.subscription_plans;

-- Criar plano único "Camply Premium"
INSERT INTO public.subscription_plans (
  plan_type,
  name,
  description,
  price_monthly,
  price_annual,
  limits,
  features,
  is_active
) VALUES (
  'premium',
  'Camply Premium',
  'Acesso completo à plataforma Camply com todas as funcionalidades',
  349.99,
  2499.00,
  '{
    "campaigns": -1,
    "monthlyBudget": -1,
    "aiSuggestions": -1,
    "campaignAnalysis": -1
  }'::jsonb,
  ARRAY[
    'Campanhas ilimitadas',
    'Orçamento ilimitado',
    'IA ilimitada',
    'Análises avançadas de campanha',
    'Gerenciamento completo de leads',
    'Integração com Meta Ads',
    'Relatórios estratégicos',
    'Suporte prioritário',
    'API personalizada'
  ],
  true
);