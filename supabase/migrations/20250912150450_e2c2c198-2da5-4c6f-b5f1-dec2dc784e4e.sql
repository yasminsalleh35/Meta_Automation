-- Create code_snapshots table for managing code snapshots
CREATE TABLE IF NOT EXISTS public.code_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  snapshot_name TEXT NOT NULL,
  description TEXT,
  files_data JSONB NOT NULL DEFAULT '{}',
  file_paths TEXT[] NOT NULL DEFAULT '{}',
  dependencies TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique snapshot names per user and sector
  UNIQUE(user_id, sector, snapshot_name)
);

-- Enable Row Level Security
ALTER TABLE public.code_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own snapshots" 
ON public.code_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snapshots" 
ON public.code_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots" 
ON public.code_snapshots 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots" 
ON public.code_snapshots 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_code_snapshots_updated_at
BEFORE UPDATE ON public.code_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();