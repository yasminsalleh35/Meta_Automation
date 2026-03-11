
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { SectorProfile } from '@/types/sectors';

interface InterestsTabProps {
  formData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>;
  onFormDataChange: (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

export const InterestsTab: React.FC<InterestsTabProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="w-5 h-5 mr-2" />
          Interesses e Tópicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ArrayFieldEditor
          title="Interesses Principais"
          field={formData.mainInterests || ['']}
          placeholder="Ex: Estética, saúde bucal, autoestima..."
          description="Principais temas de interesse"
          onChange={(newArray) => onFormDataChange({ mainInterests: newArray })}
        />

        <ArrayFieldEditor
          title="Palavras-chave"
          field={formData.keywords || ['']}
          placeholder="Ex: clareamento, lentes de contato dental..."
          description="Termos relevantes para SEO e conteúdo"
          onChange={(newArray) => onFormDataChange({ keywords: newArray })}
        />

        <ArrayFieldEditor
          title="Tópicos Relacionados"
          field={formData.relatedTopics || ['']}
          placeholder="Ex: Harmonização facial, prevenção de doenças..."
          description="Assuntos correlatos ao setor"
          onChange={(newArray) => onFormDataChange({ relatedTopics: newArray })}
        />
      </CardContent>
    </Card>
  );
};
