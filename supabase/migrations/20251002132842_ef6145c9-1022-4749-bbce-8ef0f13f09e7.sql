-- Add ad_account_id column to campaigns table to isolate campaigns by Meta Ads account
ALTER TABLE public.campaigns 
ADD COLUMN ad_account_id TEXT;

-- Create index for better query performance
CREATE INDEX idx_campaigns_ad_account_id ON public.campaigns(ad_account_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.campaigns.ad_account_id IS 'Meta Ads Ad Account ID - used to isolate campaigns by active integration';
