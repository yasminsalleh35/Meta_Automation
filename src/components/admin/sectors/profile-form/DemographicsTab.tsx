
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { SectorProfile } from '@/types/sectors';

interface DemographicsTabProps {
  formData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>;
  onFormDataChange: (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
}

export const DemographicsTab: React.FC<DemographicsTabProps> = ({
  formData,
  onFormDataChange
}) => {
  const toggleSocialClass = (className: string) => {
    const current = formData.socialClass || [];
    const updated = current.includes(className) 
      ? current.filter(c => c !== className)
      : [...current, className];
    onFormDataChange({ socialClass: updated });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Users className="w-5 h-5 mr-2" />
          Público-Alvo Demográfico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Idade Mínima</Label>
            <Input
              type="number"
              value={formData.ageRangeMin || ''}
              onChange={(e) => onFormDataChange({ ageRangeMin: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Idade Máxima</Label>
            <Input
              type="number"
              value={formData.ageRangeMax || ''}
              onChange={(e) => onFormDataChange({ ageRangeMax: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label>Preferência de Gênero</Label>
          <Select 
            value={formData.genderPreference} 
            onValueChange={(value: any) => onFormDataChange({ genderPreference: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Ambos</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female_predominant">Predominantemente feminino</SelectItem>
              <SelectItem value="male_predominant">Predominantemente masculino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Classes Sociais</Label>
          <div className="flex gap-2 mt-2">
            {['A', 'B', 'C', 'D', 'E'].map(className => (
              <Badge
                key={className}
                variant={formData.socialClass?.includes(className) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleSocialClass(className)}
              >
                Classe {className}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Tipo de Localização</Label>
          <Select 
            value={formData.locationType} 
            onValueChange={(value: any) => onFormDataChange({ locationType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urban">Urbana</SelectItem>
              <SelectItem value="suburban">Suburbana</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
              <SelectItem value="mixed">Mista</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Detalhes da Localização</Label>
          <Textarea
            value={formData.locationDetails || ''}
            onChange={(e) => onFormDataChange({ locationDetails: e.target.value })}
            placeholder="Ex: Principalmente regiões com alta densidade populacional..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Renda Mínima (R$)</Label>
            <Input
              type="number"
              value={formData.incomeRangeMin || ''}
              onChange={(e) => onFormDataChange({ incomeRangeMin: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>Renda Máxima (R$)</Label>
            <Input
              type="number"
              value={formData.incomeRangeMax || ''}
              onChange={(e) => onFormDataChange({ incomeRangeMax: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <ArrayFieldEditor
          title="Profissões"
          field={formData.professions || ['']}
          placeholder="Ex: Administração, Educação, Saúde..."
          description="Principais profissões do público-alvo"
          onChange={(newArray) => onFormDataChange({ professions: newArray })}
        />
      </CardContent>
    </Card>
  );
};
