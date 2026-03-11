
-- Add selected_locations column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN selected_locations jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.campaigns.selected_locations IS 'Stores the selected locations with Meta API IDs for targeting';
