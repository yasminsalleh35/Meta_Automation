
import React from 'react';
import { SimpleCampaignWizard } from '@/components/SimpleCampaignWizard';
import { MapboxProvider } from '@/contexts/MapboxContext';
import { MetaAssetsProvider } from '@/contexts/MetaAssetsContext';

const SimpleCampaignWizardPage: React.FC = () => {
  return (
    <MetaAssetsProvider>
      <MapboxProvider>
        <SimpleCampaignWizard />
      </MapboxProvider>
    </MetaAssetsProvider>
  );
};

export default SimpleCampaignWizardPage;
