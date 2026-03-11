export interface LiveCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'finished' | 'pending_review';
  objective: string;
  mediaPreviewUrl?: string;
  page?: { id?: string; name?: string };
  instagram?: { id?: string; username?: string };
  metrics: { 
    impressions: number; 
    reach: number; 
    clicks: number; 
    spend: number; 
    cpa?: number;
    conversations?: number;
    cost_per_messaging_conversation_started_7d?: number;
  };
  message?: string;
  title?: string;
  whatsappNumber?: string;
  created_time: string;
  metaCampaignId?: string;
  last_metrics_sync_at?: string;
  meta_data_cached_at?: string;
}