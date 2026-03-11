
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { SectorProfile } from '@/types/sectors';

interface ChannelsTabProps {
  formData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>;
  onFormDataChange: (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

export const ChannelsTab: React.FC<ChannelsTabProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="w-5 h-5 mr-2" />
          Canais e Estratégias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ArrayFieldEditor
          title="Canais Preferenciais"
          field={formData.preferredChannels || ['']}
          placeholder="Ex: Instagram, WhatsApp, Google..."
          description="Onde o público está mais ativo"
          onChange={(newArray) => onFormDataChange({ preferredChannels: newArray })}
        />

        <ArrayFieldEditor
          title="Estratégias de Marketing"
          field={formData.marketingStrategies || ['']}
          placeholder="Ex: Marketing de conteúdo, campanhas de indicação..."
          description="Estratégias que funcionam melhor"
          onChange={(newArray) => onFormDataChange({ marketingStrategies: newArray })}
        />

        <ArrayFieldEditor
          title="Tipos de Conteúdo"
          field={formData.contentTypes || ['']}
          placeholder="Ex: Reels com antes e depois, depoimentos..."
          description="Formatos de conteúdo mais eficazes"
          onChange={(newArray) => onFormDataChange({ contentTypes: newArray })}
        />

        <ArrayFieldEditor
          title="Gatilhos Mentais"
          field={formData.mentalTriggers || ['']}
          placeholder="Ex: Prova social, urgência, autoridade..."
          description="Gatilhos psicológicos que geram conversão"
          onChange={(newArray) => onFormDataChange({ mentalTriggers: newArray })}
        />

        <ArrayFieldEditor
          title="Estratégias Psicológicas"
          field={formData.psychologicalStrategies || ['']}
          placeholder="Ex: Garantias de resultado, tecnologia moderna..."
          description="Abordagens psicológicas eficazes"
          onChange={(newArray) => onFormDataChange({ psychologicalStrategies: newArray })}
        />
      </CardContent>
    </Card>
  );
};
