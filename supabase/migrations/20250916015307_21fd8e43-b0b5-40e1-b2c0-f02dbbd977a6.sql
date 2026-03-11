-- Adicionar campo supplementary_material à tabela learning_contents
ALTER TABLE public.learning_contents 
ADD COLUMN supplementary_material JSONB DEFAULT '[]'::jsonb;

-- Comentário sobre o campo
COMMENT ON COLUMN public.learning_contents.supplementary_material IS 'Material complementar como PDFs, links externos, recursos adicionais em formato JSON array';