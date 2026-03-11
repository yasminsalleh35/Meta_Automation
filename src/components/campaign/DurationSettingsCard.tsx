
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Info } from 'lucide-react';

interface DurationSettingsCardProps {
  duration: {
    startDate: string;
    endDate: string;
  };
  onDurationChange: (field: string, value: string) => void;
}

export const DurationSettingsCard: React.FC<DurationSettingsCardProps> = ({
  duration,
  onDurationChange
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <span>Duração da Campanha</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={duration.startDate || today}
              min={today}
              onChange={(e) => onDurationChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data de Fim (opcional)</Label>
            <Input
              id="endDate"
              type="date"
              value={duration.endDate}
              min={duration.startDate || today}
              onChange={(e) => onDurationChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Info className="w-4 h-4" />
          <span>Deixe data de fim em branco para campanha contínua</span>
        </div>
      </CardContent>
    </Card>
  );
};
