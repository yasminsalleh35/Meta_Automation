import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TestWizardFormData } from '@/types/testWizard.types';

interface WizardStep1InfoProps {
  formData: TestWizardFormData;
  updateFormData: (field: keyof TestWizardFormData, value: any) => void;
}

export const WizardStep1_Info: React.FC<WizardStep1InfoProps> = ({ formData, updateFormData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Passo 1: Informações Básicas</CardTitle>
        <CardDescription>Defina o nome e conteúdo da campanha</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaignName">Nome da Campanha</Label>
          <Input
            id="campaignName"
            value={formData.campaignName}
            onChange={(e) => updateFormData('campaignName', e.target.value)}
            placeholder="Ex: Teste WA.ME Link - Black Friday"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adTitle">Título do Anúncio</Label>
          <Input
            id="adTitle"
            value={formData.adTitle}
            onChange={(e) => updateFormData('adTitle', e.target.value)}
            placeholder="Ex: Fale conosco no WhatsApp"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adText">Texto do Anúncio</Label>
          <Textarea
            id="adText"
            value={formData.adText}
            onChange={(e) => updateFormData('adText', e.target.value)}
            placeholder="Ex: Clique e converse com a gente agora!"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {formData.adText.length} caracteres
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
