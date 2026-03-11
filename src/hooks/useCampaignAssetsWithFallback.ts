
import { useState, useEffect } from 'react';
import { useMetaAdsAssets } from './useMetaAdsAssets';
import { RealCampaign } from '@/types/realCampaign';

interface CampaignAsset {
  id: string;
  name: string;
  type: 'page' | 'instagram' | 'whatsapp';
  connected: boolean;
  source: 'campaign' | 'integration';
  phone?: string;
  username?: string;
  profilePic?: string;
  isManual?: boolean;
}

export const useCampaignAssetsWithFallback = (campaign: RealCampaign) => {
  const { assets: metaAssets, isLoading: isLoadingMeta } = useMetaAdsAssets();
  const [campaignAssets, setCampaignAssets] = useState<{
    facebookPage?: CampaignAsset;
    instagram?: CampaignAsset;
    whatsapp?: CampaignAsset;
  }>({});

  useEffect(() => {
    // Build campaign assets with fallback to integration data
    const assets: typeof campaignAssets = {};

    // Facebook Page
    if (campaign.facebook_page) {
      assets.facebookPage = {
        id: campaign.facebook_page,
        name: 'Página Configurada',
        type: 'page',
        connected: true,
        source: 'campaign'
      };
    } else if (metaAssets.pages.length > 0) {
      // Use first available page as fallback
      const fallbackPage = metaAssets.pages[0];
      assets.facebookPage = {
        id: fallbackPage.id,
        name: fallbackPage.name,
        type: 'page',
        connected: true,
        source: 'integration'
      };
    }

    // Instagram
    if (campaign.instagram_account) {
      assets.instagram = {
        id: campaign.instagram_account,
        name: 'Conta Configurada',
        type: 'instagram',
        connected: true,
        source: 'campaign'
      };
    } else if (metaAssets.instagram.length > 0) {
      // Use first available instagram as fallback
      const fallbackInstagram = metaAssets.instagram[0];
      assets.instagram = {
        id: fallbackInstagram.id,
        name: fallbackInstagram.name,
        type: 'instagram',
        connected: true,
        source: 'integration',
        username: fallbackInstagram.username,
        profilePic: fallbackInstagram.profilePic
      };
    }

    // WhatsApp
    if (campaign.whatsapp_number) {
      assets.whatsapp = {
        id: 'campaign-whatsapp',
        name: campaign.whatsapp_number,
        type: 'whatsapp',
        connected: true,
        source: 'campaign',
        phone: campaign.whatsapp_number
      };
    } else if (metaAssets.whatsapp.length > 0) {
      // Use first available whatsapp as fallback
      const fallbackWhatsApp = metaAssets.whatsapp[0];
      assets.whatsapp = {
        id: fallbackWhatsApp.id,
        name: fallbackWhatsApp.name,
        type: 'whatsapp',
        connected: true,
        source: 'integration',
        phone: fallbackWhatsApp.phone,
        isManual: fallbackWhatsApp.isManual
      };
    }

    setCampaignAssets(assets);
  }, [campaign, metaAssets]);

  return {
    campaignAssets,
    isLoading: isLoadingMeta,
    hasAnyAssets: Object.keys(campaignAssets).length > 0
  };
};
