
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Location settings
  location_country TEXT DEFAULT 'Brasil',
  location_state TEXT,
  location_city TEXT,
  location_radius INTEGER DEFAULT 10,
  
  -- Audience settings
  gender TEXT DEFAULT 'all',
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 65,
  interests TEXT[], -- Array of interests
  
  -- Campaign settings
  placements TEXT[] DEFAULT ARRAY['feed'],
  devices TEXT[] DEFAULT ARRAY['mobile', 'desktop'],
  
  -- Budget settings
  budget_daily DECIMAL(10,2) DEFAULT 50.00,
  budget_total DECIMAL(10,2) DEFAULT 1000.00,
  
  -- Duration
  start_date DATE,
  end_date DATE,
  
  -- Creatives
  ad_title TEXT,
  ad_text TEXT,
  destination_url TEXT,
  media_file_id UUID,
  
  -- Social media assets
  facebook_page TEXT,
  instagram_account TEXT,
  whatsapp_number TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create media_files table
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_size INTEGER,
  prompt TEXT, -- For AI generated media
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create business_settings table
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT,
  business_description TEXT,
  main_product TEXT,
  category TEXT,
  target_audience TEXT,
  business_goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Users can view own campaigns" ON public.campaigns
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns" ON public.campaigns
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns" ON public.campaigns
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns" ON public.campaigns
FOR DELETE USING (user_id = auth.uid());

-- RLS policies for media_files
CREATE POLICY "Users can view own media" ON public.media_files
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own media" ON public.media_files
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own media" ON public.media_files
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own media" ON public.media_files
FOR DELETE USING (user_id = auth.uid());

-- RLS policies for business_settings
CREATE POLICY "Users can view own business settings" ON public.business_settings
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own business settings" ON public.business_settings
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own business settings" ON public.business_settings
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own business settings" ON public.business_settings
FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX idx_business_settings_user_id ON public.business_settings(user_id);
