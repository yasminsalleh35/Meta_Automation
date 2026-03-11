import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignProfileSelector } from './CampaignProfileSelector';
import { BusinessData } from '@/hooks/useBusinessSettings';

interface CampaignProfileSectionProps {
  businessData: BusinessData;
  onProfileChange: (profileId: string | null) => void;
}

export const CampaignProfileSection: React.FC<CampaignProfileSectionProps> = ({
  businessData,
  onProfileChange
}) => {
  const handleProfileChange = (profileId: string | null) => {
    onProfileChange(profileId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Campanha</CardTitle>
        <CardDescription>
          Escolha um perfil pré-configurado para otimizar automaticamente suas campanhas. 
          Os perfis definem segmentação por idade, gênero, interesses e posicionamentos específicos para seu setor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CampaignProfileSelector
          value={businessData.campaign_profile_id}
          onValueChange={handleProfileChange}
        />
      </CardContent>
    </Card>
  );
};