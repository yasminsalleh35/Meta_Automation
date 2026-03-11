
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { SectorProfile } from '@/types/sectors';

interface AdsSegmentationTabProps {
  formData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>;
  onFormDataChange: (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

export const AdsSegmentationTab: React.FC<AdsSegmentationTabProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Target className="w-5 h-5 mr-2" />
          Segmentação para Anúncios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Raio Geográfico Padrão (km)</Label>
          <Input
            type="number"
            value={formData.geographicRadius || ''}
            onChange={(e) => onFormDataChange({ geographicRadius: parseInt(e.target.value) })}
            placeholder="8"
          />
        </div>

        <ArrayFieldEditor
          title="Interesses Meta Ads"
          field={formData.metaInterests || ['']}
          placeholder="Ex: beleza, autoestima, cuidados pessoais..."
          description="Interesses específicos para segmentação no Meta"
          onChange={(newArray) => onFormDataChange({ metaInterests: newArray })}
        />

        <ArrayFieldEditor
          title="Comportamentos Meta Ads"
          field={formData.metaBehaviors || ['']}
          placeholder="Ex: seguem perfis de clínicas de estética..."
          description="Comportamentos para segmentação no Meta"
          onChange={(newArray) => onFormDataChange({ metaBehaviors: newArray })}
        />
      </CardContent>
    </Card>
  );
};
