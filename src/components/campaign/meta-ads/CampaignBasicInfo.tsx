
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CampaignBasicInfoProps {
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
}

export const CampaignBasicInfo: React.FC<CampaignBasicInfoProps> = ({
  campaignName,
  onCampaignNameChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="campaignName">Nome da Campanha *</Label>
          <Input
            id="campaignName"
            value={campaignName}
            onChange={(e) => onCampaignNameChange(e.target.value)}
            placeholder="Ex: Campanha Vendas Janeiro 2024"
          />
        </div>
      </CardContent>
    </Card>
  );
};
