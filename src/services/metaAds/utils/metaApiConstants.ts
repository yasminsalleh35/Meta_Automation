// 1) Padronização global - Versão única da Graph API
export const META_API_VERSION = 'v23.0';

// 2) Normalização do ad_account_id (corrige act_act_...)
export function normalizeAdAccountId(adAccountId: string): string {
  if (!adAccountId) {
    throw new Error('adAccountId ausente');
  }
  
  // Remove espaços e deixa tudo sem aspas
  const clean = String(adAccountId).trim().replace(/"/g, '');
  
  // Aceita formatos: 446... ou act_446...
  return clean.startsWith('act_') ? clean : `act_${clean}`;
}

// 3) Detector de tipo de mídia (corrige "type: 'video'" para PNG)
export function resolveMediaType(fileType?: string): 'image' | 'video' {
  const t = (fileType || '').toLowerCase().trim();
  
  const imageMimes = new Set([
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/webp',
    'image/gif'
  ]);
  
  const videoMimes = new Set([
    'video/mp4',
    'video/quicktime',
    'video/mpeg', 
    'video/webm',
    'video/3gpp'
  ]);
  
  if (imageMimes.has(t)) return 'image';
  if (videoMimes.has(t)) return 'video';
  
  // fallback: se não souber, trata como imagem (adimages)
  return 'image';
}

// Função para construir URLs da Meta API com versão única
export function buildMetaApiUrl(endpoint: string): string {
  return `https://graph.facebook.com/${META_API_VERSION}${endpoint}`;
}

// Log estruturado para observabilidade
export function logMetaApiRequest(
  operation: string,
  details: {
    operation?: string;
    ad_account_normalized?: string;
    media_kind?: 'image' | 'video';
    endpoint?: string;
    content_length?: number;
    mime?: string;
    api_version?: string;
    status?: number;
    error_code?: string;
    error_message?: string;
    fbtrace_id?: string;
    body_preview?: string;
    campaign_id?: string;
    ad_id?: string;
    has_image_hash?: boolean;
    has_video_id?: boolean;
    has_instagram_actor_id?: boolean;
  }
) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    api_version: META_API_VERSION,
    ...details
  };
  
  if (details.status && details.status >= 400) {
    console.error(`[MEDIA-API][${operation}] ERROR:`, logData);
  } else {
    console.log(`[MEDIA-API][${operation}] INFO:`, logData);
  }
}