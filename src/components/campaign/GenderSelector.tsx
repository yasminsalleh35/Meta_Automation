
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <Label>Gênero</Label>
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className="flex space-x-6 mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="all" />
          <Label htmlFor="all">Todos</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="male" id="male" />
          <Label htmlFor="male">Masculino</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="female" id="female" />
          <Label htmlFor="female">Feminino</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
