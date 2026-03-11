-- Force immediate sync for existing campaigns with Meta IDs but no metrics
UPDATE campaigns 
SET needs_immediate_sync = true 
WHERE meta_campaign_id IS NOT NULL 
AND (metrics IS NULL OR last_metrics_sync_at IS NULL);