-- Adicionar colunas WhatsApp na tabela integrations
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS selected_business_id text,
  ADD COLUMN IF NOT EXISTS selected_waba_id text,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_phone_id text,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_display text,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_verified_name text;

-- Tabela opcional para cache de números WhatsApp
CREATE TABLE IF NOT EXISTS meta_whatsapp_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id text NOT NULL,
  waba_id text NOT NULL,
  phone_number_id text NOT NULL,
  display_phone_number text,
  verified_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meta_whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for meta_whatsapp_numbers
CREATE POLICY "Users can view their own WhatsApp numbers" 
ON meta_whatsapp_numbers 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own WhatsApp numbers" 
ON meta_whatsapp_numbers 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own WhatsApp numbers" 
ON meta_whatsapp_numbers 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own WhatsApp numbers" 
ON meta_whatsapp_numbers 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE TRIGGER update_meta_whatsapp_numbers_updated_at
BEFORE UPDATE ON meta_whatsapp_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();