
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain } from 'lucide-react';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { SectorProfile } from '@/types/sectors';

interface BehaviorTabProps {
  formData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>;
  onFormDataChange: (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

export const BehaviorTab: React.FC<BehaviorTabProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Brain className="w-5 h-5 mr-2" />
          Comportamentos e Decisões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Sensibilidade ao Preço</Label>
          <Select 
            value={formData.priceSensitivity} 
            onValueChange={(value: any) => onFormDataChange({ priceSensitivity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ArrayFieldEditor
          title="Comportamentos de Compra"
          field={formData.purchaseBehaviors || ['']}
          placeholder="Ex: Busca ativa por soluções para dor..."
          description="Como o público se comporta durante o processo de compra"
          onChange={(newArray) => onFormDataChange({ purchaseBehaviors: newArray })}
        />

        <ArrayFieldEditor
          title="Fatores de Decisão"
          field={formData.decisionFactors || ['']}
          placeholder="Ex: Confiança, reputação, indicações..."
          description="O que influencia a decisão de compra"
          onChange={(newArray) => onFormDataChange({ decisionFactors: newArray })}
        />

        <ArrayFieldEditor
          title="Preferências de Pagamento"
          field={formData.paymentPreferences || ['']}
          placeholder="Ex: Parcelamento, cartão, PIX..."
          description="Formas de pagamento preferidas"
          onChange={(newArray) => onFormDataChange({ paymentPreferences: newArray })}
        />

        <ArrayFieldEditor
          title="Hábitos de Pesquisa"
          field={formData.researchHabits || ['']}
          placeholder="Ex: Consome conteúdo educativo antes da compra..."
          description="Como o público pesquisa antes de comprar"
          onChange={(newArray) => onFormDataChange({ researchHabits: newArray })}
        />
      </CardContent>
    </Card>
  );
};
