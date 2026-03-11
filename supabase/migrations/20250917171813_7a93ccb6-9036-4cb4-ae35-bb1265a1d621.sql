-- Remover a política SELECT existente para substituir por uma mais abrangente
DROP POLICY IF EXISTS "Learning contents are viewable by everyone" ON public.learning_contents;

-- Criar nova política SELECT que permite admins verem todo conteúdo e usuários normais apenas conteúdo publicado
CREATE POLICY "Users can view published content, admins can view all"
ON public.learning_contents
FOR SELECT
USING (is_published = true OR is_admin_user());

-- Criar política INSERT para admins
CREATE POLICY "Admins can create learning contents"
ON public.learning_contents
FOR INSERT
WITH CHECK (is_admin_user());

-- Criar política UPDATE para admins
CREATE POLICY "Admins can update learning contents"
ON public.learning_contents
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Criar política DELETE para admins
CREATE POLICY "Admins can delete learning contents"
ON public.learning_contents
FOR DELETE
USING (is_admin_user());