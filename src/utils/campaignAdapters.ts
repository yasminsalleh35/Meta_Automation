import type { LiveCampaign } from '@/types/liveCampaign';
import type { RealCampaign } from '@/types/realCampaign';

function extractWhatsAppNumber(link?: string): string | undefined {
  if (!link) return undefined;
  const match = /wa\.me\/(\d+)/.exec(link);
  return match?.[1];
}

function mapStatus(status?: string): LiveCampaign['status'] {
  switch ((status || '').toLowerCase()) {
    case 'active': return 'active';
    case 'paused': return 'paused';
    case 'finished': return 'finished';
    case 'draft': 
    default:
      return 'draft';
  }
}

/**
 * Converte um RealCampaign (modelo local/Supabase) em LiveCampaign (modelo da UI).
 * Preenche métricas com zeros (fallback) e created_time a partir de created_at.
 */
export function realToLiveCampaign(c: RealCampaign): LiveCampaign {
  return {
    id: c.meta_campaign_id || c.id,
    name: c.name,
    status: mapStatus(c.status),
    objective: c.objective ?? 'UNKNOWN',
    mediaPreviewUrl: undefined, // RealCampaign não tem preview de mídia
    page: c.facebook_page ? { id: c.facebook_page, name: undefined } : undefined,
    instagram: c.instagram_account ? { id: c.instagram_account, username: undefined } : undefined,
    metrics: { impressions: 0, reach: 0, clicks: 0, spend: 0, cpa: undefined }, // fallback
    message: c.ad_text ?? undefined,
    title: c.ad_title ?? undefined,
    whatsappNumber: extractWhatsAppNumber(c.destination_url),
    created_time: c.created_at,
  };
}