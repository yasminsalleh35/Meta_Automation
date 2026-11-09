
import { useMetaAdsIntegration } from '../useMetaAdsIntegration';

export const useMetaAdsConnection = () => {
  const { existingIntegration } = useMetaAdsIntegration();

  const connection = {
    isConnected: !!existingIntegration && existingIntegration.status === 'active',
    adAccountId: existingIntegration?.ad_account_id || null,
    pageId: existingIntegration?.page_id || null,
    // Token só no servidor (audit SEC-12)
    accessToken: null as string | null
  };

  return {
    connection,
    integration: existingIntegration
  };
};
