-- 1) Enum para modo de posicionamento
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'placements_mode') THEN
    CREATE TYPE placements_mode AS ENUM ('automatic', 'manual');
  END IF;
END$$;

-- 2) Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.campaign_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,             -- ex: "dentista", "autoescola"
  label             text NOT NULL,                    -- "Dentista", "Autoescola"
  description       text,
  age_min           int  NOT NULL DEFAULT 18,
  age_max           int  NOT NULL DEFAULT 65,
  genders           text NOT NULL DEFAULT 'all',      -- 'all' | 'male' | 'female'
  placements_mode   placements_mode NOT NULL DEFAULT 'automatic',
  placements        jsonb NOT NULL DEFAULT '[]',      -- ["instagram_feed","facebook_feed",...]
  interests         jsonb NOT NULL DEFAULT '[]',      -- [{ "id":"6003139266461", "name":"Dentistry" }]
  is_active         boolean NOT NULL DEFAULT true,
  version           int NOT NULL DEFAULT 1,
  created_by        uuid REFERENCES auth.users (id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS campaign_profiles_is_active_idx ON public.campaign_profiles (is_active);
CREATE INDEX IF NOT EXISTS campaign_profiles_slug_idx      ON public.campaign_profiles (slug);

-- 4) RLS (todos leem; só admin grava)
ALTER TABLE public.campaign_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cp_select_all ON public.campaign_profiles;
CREATE POLICY cp_select_all
ON public.campaign_profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS cp_admin_write ON public.campaign_profiles;
CREATE POLICY cp_admin_write
ON public.campaign_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin','super_admin')
  )
);

-- 5) Vínculo no My Business
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS campaign_profile_id uuid REFERENCES public.campaign_profiles (id);

-- 6) Auditoria opcional na campanha
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS applied_profile_id uuid,
ADD COLUMN IF NOT EXISTS applied_profile_version int;

-- Seed inicial
INSERT INTO public.campaign_profiles (slug,label,description,age_min,age_max,genders,placements_mode,placements,interests,is_active,version)
VALUES
('dentista','Dentista','Perfil otimizado para clínicas odontológicas',25,55,'all','manual',
  '["instagram_feed","instagram_stories","facebook_feed"]',
  '[{"id":"6003139266461","name":"Dentistry"},{"id":"6003050992579","name":"Teeth whitening"}]',
  true,1
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.campaign_profiles (slug,label,description,age_min,age_max,genders,placements_mode,placements,interests,is_active,version)
VALUES
('autoescola','Autoescola','Perfil otimizado para autoescolas',18,35,'all','manual',
  '["instagram_feed","instagram_reels","facebook_feed"]',
  '[{"id":"6003308630761","name":"Drivers education"}]',
  true,1
)
ON CONFLICT (slug) DO NOTHING;