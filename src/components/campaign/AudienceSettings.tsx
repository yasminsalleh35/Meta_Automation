
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { GenderSelector } from '@/components/campaign/GenderSelector';
import { AgeRangeSelector } from '@/components/campaign/AgeRangeSelector';
import { InterestSelector } from '@/components/campaign/InterestSelector';

interface AudienceData {
  gender: string;
  ageRange: {
    min: number;
    max: number;
  };
  interests: string[];
}

interface AudienceSettingsProps {
  audience: AudienceData;
  aiSuggestions?: { interests: string[] } | null;
  onAudienceChange: (field: string, value: any) => void;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (interest: string) => void;
}

export const AudienceSettings: React.FC<AudienceSettingsProps> = ({
  audience,
  aiSuggestions,
  onAudienceChange,
  onAddInterest,
  onRemoveInterest
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Público-Alvo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenderSelector
          value={audience.gender}
          onChange={(value) => onAudienceChange('gender', value)}
        />

        <AgeRangeSelector
          value={audience.ageRange}
          onChange={(ageRange) => onAudienceChange('ageRange', ageRange)}
        />

        <InterestSelector
          interests={audience.interests}
          aiSuggestions={aiSuggestions}
          onAddInterest={onAddInterest}
          onRemoveInterest={onRemoveInterest}
        />
      </CardContent>
    </Card>
  );
};
