
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Instagram, Wand2 } from 'lucide-react';
import { MetaAsset } from './types';

interface InstagramAutoSelectorProps {
  selectedFanPage: string;
  selectedInstagram: string;
  instagram: MetaAsset[];
  isOptimalSelection: boolean;
  suggestedInstagram: MetaAsset | null;
  onAssetChange: (field: string, value: string) => void;
}

export const InstagramAutoSelector: React.FC<InstagramAutoSelectorProps> = ({
  selectedFanPage,
  selectedInstagram,
  instagram,
  isOptimalSelection,
  suggestedInstagram,
  onAssetChange
}) => {
  const handleAutoSelect = () => {
    if (suggestedInstagram) {
      onAssetChange('selectedInstagram', suggestedInstagram.id);
    }
  };

  // Don't show if no page selected or no Instagram accounts
  if (!selectedFanPage || instagram.length === 0) {
    return null;
  }

  // Only show suggestion if there's a better option available
  if (suggestedInstagram && !isOptimalSelection) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Instagram className="w-4 h-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>
              <strong>Sugestão:</strong> Use {suggestedInstagram.name} 
              {suggestedInstagram.username && ` (@${suggestedInstagram.username})`}
            </span>
            <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
              Recomendado
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAutoSelect}
            className="ml-2"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Selecionar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
