
-- Criar tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração inicial para o modo demo
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('meta_review_demo_mode', '{"enabled": false}', 'Modo demo para gravação do Meta Review - apenas super admins'),
  ('default_language', '{"language": "pt"}', 'Idioma padrão da plataforma')
ON CONFLICT (setting_key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir apenas super admins lerem/modificarem
CREATE POLICY "Only super admins can access system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o updated_at
CREATE TRIGGER update_system_settings_updated_at_trigger
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();
