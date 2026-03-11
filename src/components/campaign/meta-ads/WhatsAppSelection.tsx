
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { MetaAsset } from './types';

interface WhatsAppSelectionProps {
  whatsapp: MetaAsset[];
  selectedWhatsApp: string;
  isLoadingAssets: boolean;
  onAssetChange: (field: string, value: string) => void;
  onAddWhatsApp: () => void;
  onRemoveWhatsApp: (id: string, isManual: boolean) => void;
}

export const WhatsAppSelection: React.FC<WhatsAppSelectionProps> = ({
  whatsapp,
  selectedWhatsApp,
  isLoadingAssets,
  onAssetChange,
  onAddWhatsApp,
  onRemoveWhatsApp
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="whatsapp">WhatsApp Business ({whatsapp.length} disponíveis)</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddWhatsApp}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>
      <Select
        value={selectedWhatsApp}
        onValueChange={(value) => onAssetChange('selectedWhatsApp', value)}
        disabled={isLoadingAssets}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={
            whatsapp.length > 0 
              ? "Selecione um número do WhatsApp" 
              : "Adicione um número do WhatsApp Business"
          } />
        </SelectTrigger>
        <SelectContent>
          {whatsapp.map((wa) => (
            <SelectItem key={wa.id} value={wa.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>{wa.name}</span>
                  {wa.phone && (
                    <span className="text-xs text-gray-500">({wa.phone})</span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {wa.isManual ? 'Manual' : 'Meta API'}
                  </Badge>
                </div>
                {wa.isManual && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWhatsApp(wa.id, true);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 h-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {whatsapp.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50 mt-2">
          <AlertDescription>
            Nenhum WhatsApp Business encontrado via API. Clique em "Adicionar" para configurar manualmente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
