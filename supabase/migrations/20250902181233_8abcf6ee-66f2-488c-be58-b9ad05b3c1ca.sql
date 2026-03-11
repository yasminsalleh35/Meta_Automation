-- Add unique constraint for ai_configurations to enable proper upsert
ALTER TABLE public.ai_configurations 
ADD CONSTRAINT ai_configurations_provider_model_unique 
UNIQUE (provider, model_name);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_configurations_active_default 
ON public.ai_configurations (is_active, is_default) 
WHERE is_active = true;