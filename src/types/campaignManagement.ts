
export interface MetaCampaignStatus {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  effective_status: string;
  configured_status: string;
  name: string;
  objective: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
}

export interface CampaignSyncResult {
  success: boolean;
  localStatus: string;
  metaStatus: string;
  synced: boolean;
  error?: string;
}

export interface CampaignManagementResponse {
  success: boolean;
  campaignId: string;
  newStatus: string;
  message?: string;
  error?: string;
}

export interface BulkCampaignOperation {
  campaignIds: string[];
  action: 'pause' | 'activate' | 'delete';
}

export interface CampaignPerformanceMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  reach: number;
  frequency: number;
  date_start: string;
  date_stop: string;
}
