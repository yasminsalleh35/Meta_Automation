
-- Create table for WhatsApp numbers history
CREATE TABLE public.whatsapp_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, number)
);

-- Enable RLS
ALTER TABLE public.whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own WhatsApp numbers"
  ON public.whatsapp_numbers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp numbers"
  ON public.whatsapp_numbers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp numbers"
  ON public.whatsapp_numbers
  FOR DELETE
  USING (auth.uid() = user_id);
