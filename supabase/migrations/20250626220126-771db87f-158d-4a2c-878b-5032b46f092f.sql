
-- Criar tabela para armazenar snapshots de código setorizados
CREATE TABLE public.code_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector TEXT NOT NULL, -- sidebar, header, campaigns, wizard, admin, integrations, dashboard, auth
  snapshot_name TEXT NOT NULL,
  description TEXT,
  files_data JSONB NOT NULL DEFAULT '{}', -- Armazena o conteúdo de todos os arquivos do setor
  dependencies JSONB DEFAULT '[]', -- Lista de setores que podem ser afetados
  file_paths JSONB DEFAULT '[]', -- Lista de caminhos dos arquivos incluídos
  metadata JSONB DEFAULT '{}', -- Informações adicionais como versão, tags, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que não existam snapshots duplicados para o mesmo usuário, setor e nome
  UNIQUE(user_id, sector, snapshot_name)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.code_snapshots ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios snapshots
CREATE POLICY "Users can view their own snapshots" 
  ON public.code_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem seus próprios snapshots
CREATE POLICY "Users can create their own snapshots" 
  ON public.code_snapshots 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios snapshots
CREATE POLICY "Users can update their own snapshots" 
  ON public.code_snapshots 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários deletarem seus próprios snapshots
CREATE POLICY "Users can delete their own snapshots" 
  ON public.code_snapshots 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_code_snapshots_user_sector ON public.code_snapshots(user_id, sector);
CREATE INDEX idx_code_snapshots_created_at ON public.code_snapshots(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_code_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_code_snapshots_updated_at_trigger
  BEFORE UPDATE ON public.code_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_code_snapshots_updated_at();
