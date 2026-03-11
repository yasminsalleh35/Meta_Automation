-- Criar tabela de comentários para conteúdo de aprendizado
CREATE TABLE public.learning_content_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.learning_contents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.learning_content_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS na tabela de comentários
ALTER TABLE public.learning_content_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comentários
-- Todos podem visualizar comentários
CREATE POLICY "Anyone can view comments"
ON public.learning_content_comments
FOR SELECT
USING (true);

-- Usuários autenticados podem criar comentários próprios
CREATE POLICY "Users can create their own comments"
ON public.learning_content_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios comentários
CREATE POLICY "Users can update their own comments"
ON public.learning_content_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar apenas seus próprios comentários
CREATE POLICY "Users can delete their own comments"
ON public.learning_content_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_learning_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_learning_content_comments_updated_at
BEFORE UPDATE ON public.learning_content_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_learning_comments_updated_at();