import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    metrics?: {
      impressions: number;
      clicks: number;
      spend: number;
    };
  };
}

/**
 * Campaign Card com React.memo para reduzir re-renders desnecessários
 * e consequentemente chamadas à API do Meta
 */
export const CampaignCardMemoized = React.memo<CampaignCardProps>(({ campaign }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg">{campaign.name}</h3>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>
        </div>
        
        {campaign.metrics && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Impressões</p>
              <p className="font-semibold">{campaign.metrics.impressions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cliques</p>
              <p className="font-semibold">{campaign.metrics.clicks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gasto</p>
              <p className="font-semibold">R$ {campaign.metrics.spend.toFixed(2)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: só re-renderiza se os dados realmente mudarem
  return (
    prevProps.campaign.id === nextProps.campaign.id &&
    prevProps.campaign.name === nextProps.campaign.name &&
    prevProps.campaign.status === nextProps.campaign.status &&
    prevProps.campaign.metrics?.impressions === nextProps.campaign.metrics?.impressions &&
    prevProps.campaign.metrics?.clicks === nextProps.campaign.metrics?.clicks &&
    prevProps.campaign.metrics?.spend === nextProps.campaign.metrics?.spend
  );
});

CampaignCardMemoized.displayName = 'CampaignCardMemoized';
