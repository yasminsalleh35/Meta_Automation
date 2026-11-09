import { GRAPH_BASE } from './meta.ts'; // audit PLT-03
// supabase/functions/_shared/metaCascade.ts
// Ativação/pausa em cascata Campaign → AdSet → Ad (audit CMP-09).
// Extraído de simple-campaign-activate para ser reutilizado por meta-campaign-bulk-operations.


export interface CascadeIds {
  campaignId: string;
  adsetId?: string | null;
  adId?: string | null;
}

/** effective_status que, logo após ativar, indicam que a ativação não pegou. */
export const ACTIVATION_ERROR_STATES = ['PAUSED', 'DISAPPROVED', 'ARCHIVED', 'DELETED'];

export function hasCascadeIds(ids: CascadeIds): boolean {
  return !!(ids.adsetId && ids.adId);
}

async function setObjectStatus(objectId: string, status: 'ACTIVE' | 'PAUSED', accessToken: string): Promise<Response> {
  return await fetch(`${GRAPH_BASE}/${objectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, access_token: accessToken }),
  });
}

async function activateObject(objectId: string, label: string, accessToken: string): Promise<void> {
  const res = await setObjectStatus(objectId, 'ACTIVE', accessToken);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao ativar ${label}: ${err.error?.message || 'Unknown error'}`);
  }
  console.log(`✅ ${label} activated:`, objectId);
}

// Pausa best-effort (usada em rollback): nunca lança
async function pauseObject(objectId: string, label: string, accessToken: string): Promise<void> {
  try {
    await setObjectStatus(objectId, 'PAUSED', accessToken);
    console.log(`🔄 ${label} rolled back to PAUSED:`, objectId);
  } catch (e) {
    console.error(`⚠️ Rollback failed for ${label}:`, objectId, e);
  }
}

/**
 * Ativa Campaign → AdSet → Ad. Se um nível falhar, pausa os níveis já ativados
 * e lança erro com mensagem em PT-BR. Sem adset/ad, ativa só a campanha.
 */
export async function activateCascade(ids: CascadeIds, accessToken: string): Promise<void> {
  if (!hasCascadeIds(ids)) {
    console.log('⚠️ [CAMPAIGN-ONLY] Activating only Campaign...');
    await activateObject(ids.campaignId, 'Campaign', accessToken);
    return;
  }

  console.log('🔄 [CASCADE] Step 1/3: Activating Campaign...');
  await activateObject(ids.campaignId, 'Campaign', accessToken);

  try {
    console.log('🔄 [CASCADE] Step 2/3: Activating AdSet...');
    await activateObject(ids.adsetId!, 'AdSet', accessToken);
  } catch (adsetError) {
    console.error('❌ AdSet activation failed, rolling back Campaign...', adsetError);
    await pauseObject(ids.campaignId, 'Campaign', accessToken);
    throw new Error(`Falha ao ativar conjunto de anúncios: ${(adsetError as Error)?.message || 'Erro desconhecido'}`);
  }

  try {
    console.log('🔄 [CASCADE] Step 3/3: Activating Ad...');
    await activateObject(ids.adId!, 'Ad', accessToken);
  } catch (adError) {
    console.error('❌ Ad activation failed, rolling back...', adError);
    await pauseObject(ids.adsetId!, 'AdSet', accessToken);
    await pauseObject(ids.campaignId, 'Campaign', accessToken);
    throw new Error(`Falha ao ativar anúncio: ${(adError as Error)?.message || 'Erro desconhecido'}`);
  }
}

/** Pausa todos os níveis conhecidos (best-effort, ordem inversa). */
export async function pauseCascade(ids: CascadeIds, accessToken: string): Promise<void> {
  if (ids.adId) await pauseObject(ids.adId, 'Ad', accessToken);
  if (ids.adsetId) await pauseObject(ids.adsetId, 'AdSet', accessToken);
  await pauseObject(ids.campaignId, 'Campaign', accessToken);
}

/** Lê effective_status de um objeto Meta; null se não for possível. */
export async function fetchEffectiveStatus(objectId: string, label: string, accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH_BASE}/${objectId}?fields=id,status,effective_status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`📊 ${label} verification:`, data);
      return data.effective_status || null;
    }
  } catch (e) {
    console.warn(`⚠️ Could not verify ${label} status:`, e);
  }
  return null;
}
