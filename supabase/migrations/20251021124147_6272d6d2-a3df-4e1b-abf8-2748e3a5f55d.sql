-- Add composite index for campaigns table to optimize queries by user_id, ad_account_id and created_at
CREATE INDEX IF NOT EXISTS idx_campaigns_user_account_created 
ON public.campaigns(user_id, ad_account_id, created_at DESC);

-- Add comment to explain the index purpose
COMMENT ON INDEX idx_campaigns_user_account_created IS 'Composite index to optimize campaign queries filtered by user and ad account, ordered by creation date';