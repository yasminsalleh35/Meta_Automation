import type { QueryClient } from '@tanstack/react-query';
import { metaCache } from '@/lib/metaCache';
import { clearRoleCache } from '@/utils/roleCacheUtils';

// Chaves de localStorage com dados de um usuário específico (audit SEC-13).
// Mantidas de propósito: 'theme' e 'camply_welcome_banner_dismissed_<userId>' (já escopadas).
const USER_SCOPED_KEYS = [
  'camply_meta_assets_cache',
  'camply_manual_whatsapp',
  'camply_business_data',
  'selected_specialization',
  'camply_auto_discover_at',
  'camply_ai_config',
  'camply_ai_cache',
  'camply_ai_metrics',
  'camply_generated_media',
  'whatsapp_numbers_history',
  'admin_mapbox_token',
];

/** Remove caches do usuário anterior: React Query, metaCache, papel e localStorage. */
export function clearUserData(queryClient?: QueryClient): void {
  try {
    queryClient?.clear();
  } catch {
    // ignore
  }
  try {
    metaCache.clear();
  } catch {
    // ignore
  }
  try {
    clearRoleCache();
  } catch {
    // ignore
  }
  try {
    for (const key of USER_SCOPED_KEYS) localStorage.removeItem(key);
  } catch {
    // storage indisponível (modo privado etc.)
  }
}
