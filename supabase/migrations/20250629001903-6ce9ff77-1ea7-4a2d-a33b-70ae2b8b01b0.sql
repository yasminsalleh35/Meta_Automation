
-- Criar tabela para categorias de setores
CREATE TABLE public.sector_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para especializações dos setores
CREATE TABLE public.sector_specializations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.sector_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para templates de campanhas (já existe função mas não a tabela)
CREATE TABLE public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sector_specializations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  suggested_budget_min NUMERIC NOT NULL,
  suggested_budget_max NUMERIC NOT NULL,
  key_messages TEXT[] NOT NULL DEFAULT '{}',
  creative_guidelines TEXT[] NOT NULL DEFAULT '{}',
  best_practices TEXT[] NOT NULL DEFAULT '{}',
  success_metrics TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.sector_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura para todos os usuários autenticados
CREATE POLICY "Users can view sector categories" 
  ON public.sector_categories 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can view sector specializations" 
  ON public.sector_specializations 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can view campaign templates" 
  ON public.campaign_templates 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Políticas para admins poderem gerenciar
CREATE POLICY "Admins can manage sector categories" 
  ON public.sector_categories 
  FOR ALL 
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Admins can manage sector specializations" 
  ON public.sector_specializations 
  FOR ALL 
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Admins can manage campaign templates" 
  ON public.campaign_templates 
  FOR ALL 
  TO authenticated
  USING (public.is_admin_user());

-- Inserir dados iniciais
INSERT INTO public.sector_categories (name, description) VALUES
('Tecnologia', 'Setor de tecnologia e inovação'),
('Saúde', 'Setor de saúde e bem-estar'),
('Educação', 'Setor educacional'),
('Varejo', 'Comércio e varejo'),
('Alimentação', 'Restaurantes e alimentação'),
('Serviços', 'Prestação de serviços diversos'),
('Consultoria', 'Consultoria empresarial'),
('Marketing', 'Agências e marketing'),
('Imobiliário', 'Mercado imobiliário'),
('Beleza e Estética', 'Salões e clínicas de estética');

-- Inserir especializações para algumas categorias
INSERT INTO public.sector_specializations (category_id, name, description) 
SELECT 
  sc.id, 
  specialization.name, 
  specialization.description 
FROM public.sector_categories sc,
(VALUES 
  ('Tecnologia', 'Desenvolvimento de Software', 'Empresas de desenvolvimento de software'),
  ('Tecnologia', 'Hardware e Equipamentos', 'Venda e manutenção de hardware'),
  ('Tecnologia', 'Consultoria em TI', 'Consultoria e suporte técnico'),
  ('Saúde', 'Odontologia', 'Clínicas e consultórios odontológicos'),
  ('Saúde', 'Nutrição', 'Nutricionistas e clínicas de nutrição'),
  ('Saúde', 'Fisioterapia', 'Clínicas de fisioterapia'),
  ('Saúde', 'Medicina Estética', 'Procedimentos estéticos médicos'),
  ('Educação', 'Cursos Online', 'Plataformas de ensino à distância'),
  ('Educação', 'Escola de Idiomas', 'Ensino de idiomas'),
  ('Educação', 'Coaching', 'Coaching pessoal e profissional'),
  ('Varejo', 'Moda e Vestuário', 'Lojas de roupas e acessórios'),
  ('Varejo', 'Eletrônicos', 'Venda de produtos eletrônicos'),
  ('Alimentação', 'Restaurantes', 'Restaurantes e lanchonetes'),
  ('Alimentação', 'Delivery', 'Serviços de entrega de comida'),
  ('Beleza e Estética', 'Salão de Beleza', 'Salões de beleza e cabeleireiros'),
  ('Beleza e Estética', 'Estética Corporal', 'Tratamentos estéticos corporais')
) AS specialization(category_name, name, description)
WHERE sc.name = specialization.category_name;

-- Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sector_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sector_specializations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaign_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sector_categories_updated_at_trigger
  BEFORE UPDATE ON public.sector_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_sector_categories_updated_at();

CREATE TRIGGER update_sector_specializations_updated_at_trigger
  BEFORE UPDATE ON public.sector_specializations
  FOR EACH ROW
  EXECUTE FUNCTION update_sector_specializations_updated_at();

CREATE TRIGGER update_campaign_templates_updated_at_trigger
  BEFORE UPDATE ON public.campaign_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_templates_updated_at();
