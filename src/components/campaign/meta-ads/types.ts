
export interface MetaAsset {
  id: string;
  name: string;
  type: 'page' | 'instagram' | 'whatsapp';
  connected: boolean;
  status?: string;
  category?: string;
  followers?: number;
  phone?: string;
  username?: string;
  profilePic?: string;
  isManual?: boolean;
  isPageConnected?: boolean;
}

export interface MetaAssetsSelectionProps {
  assets: {
    pages: MetaAsset[];
    instagram: MetaAsset[];
    whatsapp: MetaAsset[];
  };
  selectedFanPage: string;
  selectedInstagram: string;
  selectedWhatsApp: string;
  isLoadingAssets: boolean;
  hasIntegration: boolean;
  isConnected: boolean;
  onAssetChange: (field: string, value: string) => void;
  onRefreshAssets: () => void;
}
