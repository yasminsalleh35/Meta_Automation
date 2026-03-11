
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Instagram, CheckCircle, AlertCircle } from 'lucide-react';
import { MetaAsset } from './types';
import { InstagramAutoSelector } from './InstagramAutoSelector';
import { InstagramConnectionValidator } from './InstagramConnectionValidator';
import { useInstagramAutoSelection } from '@/hooks/useInstagramAutoSelection';

interface InstagramSelectionProps {
  instagram: MetaAsset[];
  selectedInstagram: string;
  selectedFanPage: string;
  isConnected: boolean;
  isLoadingAssets: boolean;
  onAssetChange: (field: string, value: string) => void;
}

export const InstagramSelection: React.FC<InstagramSelectionProps> = ({
  instagram,
  selectedInstagram,
  selectedFanPage,
  isConnected,
  isLoadingAssets,
  onAssetChange
}) => {
  const [isConnectionValid, setIsConnectionValid] = useState(true);
  const [suggestedInstagram, setSuggestedInstagram] = useState<string>('');

  const { getSuggestedInstagram, isOptimalSelection } = useInstagramAutoSelection({
    selectedFanPage,
    selectedInstagram,
    instagram,
    onAssetChange
  });

  const suggested = getSuggestedInstagram();
  const isOptimal = isOptimalSelection();

  const handleValidationChange = (isValid: boolean, suggestion?: string) => {
    setIsConnectionValid(isValid);
    if (suggestion) {
      setSuggestedInstagram(suggestion);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="instagram">Instagram Business ({instagram.length} disponíveis)</Label>
      
      <Select
        value={selectedInstagram}
        onValueChange={(value) => onAssetChange('selectedInstagram', value)}
        disabled={!isConnected || isLoadingAssets}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={
            instagram.length > 0 
              ? "Selecione uma conta do Instagram" 
              : "Nenhuma conta Instagram conectada"
          } />
        </SelectTrigger>
        <SelectContent>
          {instagram.map((ig) => (
            <SelectItem key={ig.id} value={ig.id}>
              <div className="flex items-center space-x-2">
                <Instagram className="w-4 h-4 text-pink-600" />
                {ig.profilePic && (
                  <img 
                    src={ig.profilePic} 
                    alt={ig.name} 
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span>{ig.name}</span>
                {ig.username && (
                  <span className="text-xs text-gray-500">(@{ig.username})</span>
                )}
                {ig.isPageConnected ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conectada à página
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Apenas no Ad Account
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Connection Validator */}
      <InstagramConnectionValidator
        selectedFanPage={selectedFanPage}
        selectedInstagram={selectedInstagram}
        onValidationChange={handleValidationChange}
      />

      {/* Auto-selector component */}
      <InstagramAutoSelector
        selectedFanPage={selectedFanPage}
        selectedInstagram={selectedInstagram}
        instagram={instagram}
        isOptimalSelection={isOptimal}
        suggestedInstagram={suggested}
        onAssetChange={onAssetChange}
      />
      
      {instagram.length === 0 && isConnected && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription>
            Nenhuma conta do Instagram encontrada. Conecte uma conta do Instagram ao seu Meta Business Manager.
          </AlertDescription>
        </Alert>
      )}

      {instagram.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            <strong>Dica:</strong> Contas marcadas como "Conectada à página" funcionam melhor no Meta Ads Manager. 
            Para conectar uma conta à página, acesse o Meta Business Manager.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
