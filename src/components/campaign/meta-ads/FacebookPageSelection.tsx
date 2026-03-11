
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Facebook } from 'lucide-react';
import { MetaAsset } from './types';

interface FacebookPageSelectionProps {
  pages: MetaAsset[];
  selectedFanPage: string;
  isConnected: boolean;
  isLoadingAssets: boolean;
  onAssetChange: (field: string, value: string) => void;
}

export const FacebookPageSelection: React.FC<FacebookPageSelectionProps> = ({
  pages,
  selectedFanPage,
  isConnected,
  isLoadingAssets,
  onAssetChange
}) => {
  return (
    <div>
      <Label htmlFor="fanPage">Página do Facebook * ({pages.length} disponíveis)</Label>
      <Select
        value={selectedFanPage}
        onValueChange={(value) => onAssetChange('selectedFanPage', value)}
        disabled={!isConnected || isLoadingAssets}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={
            pages.length > 0 
              ? "Selecione uma página do Facebook" 
              : "Nenhuma página encontrada"
          } />
        </SelectTrigger>
        <SelectContent>
          {pages.map((page) => (
            <SelectItem key={page.id} value={page.id}>
              <div className="flex items-center space-x-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>{page.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {page.category}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
