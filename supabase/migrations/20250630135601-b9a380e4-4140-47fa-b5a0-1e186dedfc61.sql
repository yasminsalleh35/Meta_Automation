
-- Criar tabelas para o centro de aprendizado
CREATE TABLE public.learning_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_contents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.learning_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'article', -- article, video, tutorial, guide
  content_url text,
  thumbnail_url text,
  duration_minutes integer,
  difficulty_level text DEFAULT 'beginner', -- beginner, intermediate, advanced
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_learning_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_id uuid REFERENCES public.learning_contents(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0,
  completed_at timestamp with time zone,
  is_favorited boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Triggers para updated_at
CREATE TRIGGER update_learning_categories_updated_at
  BEFORE UPDATE ON public.learning_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_contents_updated_at
  BEFORE UPDATE ON public.learning_contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_progress_updated_at
  BEFORE UPDATE ON public.user_learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para as tabelas
ALTER TABLE public.learning_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Learning categories are viewable by everyone" ON public.learning_categories FOR SELECT USING (true);
CREATE POLICY "Learning contents are viewable by everyone" ON public.learning_contents FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view their own progress" ON public.user_learning_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON public.user_learning_progress FOR ALL USING (auth.uid() = user_id);

-- Inserir algumas categorias iniciais
INSERT INTO public.learning_categories (name, description, icon, sort_order) VALUES
('Primeiros Passos', 'Aprenda o básico para começar', 'play-circle', 1),
('Meta Ads', 'Configuração e otimização de campanhas', 'target', 2),
('WhatsApp Business', 'Marketing via WhatsApp', 'message-circle', 3),
('Analytics', 'Análise de resultados e métricas', 'bar-chart', 4),
('Estratégias Avançadas', 'Técnicas avançadas de marketing', 'trending-up', 5);

-- Inserir alguns conteúdos iniciais
INSERT INTO public.learning_contents (category_id, title, description, content_type, duration_minutes, difficulty_level) 
SELECT 
  c.id,
  'Como criar sua primeira campanha',
  'Aprenda passo a passo como criar e configurar sua primeira campanha de marketing digital',
  'tutorial',
  15,
  'beginner'
FROM public.learning_categories c WHERE c.name = 'Primeiros Passos';

INSERT INTO public.learning_contents (category_id, title, description, content_type, duration_minutes, difficulty_level)
SELECT 
  c.id,
  'Configurando Meta Ads',
  'Tutorial completo sobre como integrar e configurar sua conta do Meta Ads',
  'video',
  25,
  'intermediate'
FROM public.learning_categories c WHERE c.name = 'Meta Ads';
