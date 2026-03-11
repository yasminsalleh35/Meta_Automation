-- =================================================================
-- CONFIGURAÇÃO DO BUCKET user-media COM LIMITES AJUSTADOS
-- Imagens: 50MB | Vídeos: 1GB (limites do Meta)
-- =================================================================

-- Atualizar configuração do bucket user-media
UPDATE storage.buckets
SET 
  file_size_limit = 1073741824, -- 1GB em bytes (limite máximo para vídeos)
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ]
WHERE id = 'user-media';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_created 
ON public.media_files(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_files_size 
ON public.media_files(file_size DESC);

CREATE INDEX IF NOT EXISTS idx_media_files_type
ON public.media_files(file_type);

-- Remover policies antigas se existirem
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Restrict large uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload media with size validation" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view media in user-media bucket" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- RLS Policy para upload com validação de tamanho por tipo
CREATE POLICY "Users can upload media with size validation"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media' AND
  (auth.uid())::text = (storage.foldername(name))[1] AND
  (
    (metadata->>'mimetype' LIKE 'image/%' AND (metadata->>'size')::bigint <= 52428800) OR
    (metadata->>'mimetype' LIKE 'video/%' AND (metadata->>'size')::bigint <= 1073741824)
  )
);

-- Policy para visualização
CREATE POLICY "Users can view media in user-media bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-media');

-- Policy para atualização
CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy para deleção
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Constraint para validar tamanho na tabela media_files
ALTER TABLE public.media_files
DROP CONSTRAINT IF EXISTS check_file_size_by_type;

ALTER TABLE public.media_files
ADD CONSTRAINT check_file_size_by_type 
CHECK (
  (file_type LIKE 'image/%' AND file_size <= 52428800) OR
  (file_type LIKE 'video/%' AND file_size <= 1073741824)
);