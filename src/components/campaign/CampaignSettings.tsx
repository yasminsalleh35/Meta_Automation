
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Smartphone, Monitor, Facebook, Instagram, Target } from 'lucide-react';

interface CampaignData {
  placements: string[];
  devices: string[];
  budget: {
    daily: number;
    total: number;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
}

interface CampaignSettingsProps {
  campaignData: CampaignData;
  onCampaignDataChange: (field: string, value: any) => void;
}

const placementOptions = [
  { id: 'feed', label: 'Feed do Facebook/Instagram', icon: Facebook },
  { id: 'stories', label: 'Stories', icon: Instagram },
  { id: 'reels', label: 'Reels', icon: Instagram },
  { id: 'automatic', label: 'Posicionamento Automático', icon: Target }
];

export const CampaignSettings: React.FC<CampaignSettingsProps> = ({
  campaignData,
  onCampaignDataChange
}) => {
  const handlePlacementChange = (placementId: string, checked: boolean) => {
    if (checked) {
      onCampaignDataChange('placements', [...campaignData.placements, placementId]);
    } else {
      onCampaignDataChange('placements', campaignData.placements.filter(p => p !== placementId));
    }
  };

  const handleDeviceChange = (deviceId: string, checked: boolean) => {
    if (checked) {
      onCampaignDataChange('devices', [...campaignData.devices, deviceId]);
    } else {
      onCampaignDataChange('devices', campaignData.devices.filter(d => d !== deviceId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Placement and Device Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Posicionamentos e Dispositivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Posicionamentos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {placementOptions.map((placement) => (
                <div key={placement.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={placement.id}
                    checked={campaignData.placements.includes(placement.id)}
                    onCheckedChange={(checked) => handlePlacementChange(placement.id, !!checked)}
                  />
                  <Label htmlFor={placement.id} className="flex items-center space-x-2">
                    <placement.icon className="w-4 h-4" />
                    <span>{placement.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Dispositivos</Label>
            <div className="flex space-x-6 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mobile"
                  checked={campaignData.devices.includes('mobile')}
                  onCheckedChange={(checked) => handleDeviceChange('mobile', !!checked)}
                />
                <Label htmlFor="mobile" className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="desktop"
                  checked={campaignData.devices.includes('desktop')}
                  onCheckedChange={(checked) => handleDeviceChange('desktop', !!checked)}
                />
                <Label htmlFor="desktop" className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop</span>
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget and Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Orçamento e Programação</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyBudget">Orçamento Diário (R$)</Label>
              <Input 
                id="dailyBudget"
                type="number"
                value={campaignData.budget.daily}
                onChange={(e) => onCampaignDataChange('budget', { 
                  ...campaignData.budget, 
                  daily: parseFloat(e.target.value) || 0 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="totalBudget">Orçamento Total (R$)</Label>
              <Input 
                id="totalBudget"
                type="number"
                value={campaignData.budget.total}
                onChange={(e) => onCampaignDataChange('budget', { 
                  ...campaignData.budget, 
                  total: parseFloat(e.target.value) || 0 
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input 
                id="startDate"
                type="date"
                value={campaignData.duration.startDate}
                onChange={(e) => onCampaignDataChange('duration', { 
                  ...campaignData.duration, 
                  startDate: e.target.value 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Data de Fim (opcional)</Label>
              <Input 
                id="endDate"
                type="date"
                value={campaignData.duration.endDate}
                onChange={(e) => onCampaignDataChange('duration', { 
                  ...campaignData.duration, 
                  endDate: e.target.value 
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
