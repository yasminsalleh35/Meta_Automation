
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AgeRangeData {
  min: number;
  max: number;
}

interface AgeRangeSelectorProps {
  value: AgeRangeData;
  onChange: (ageRange: AgeRangeData) => void;
}

export const AgeRangeSelector: React.FC<AgeRangeSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <Label>Faixa Etária</Label>
      <div className="flex items-center space-x-4 mt-2">
        <div>
          <Label htmlFor="ageMin" className="text-sm">Mín.</Label>
          <Input 
            id="ageMin"
            type="number" 
            min="13" 
            max="65"
            value={value.min}
            onChange={(e) => onChange({ 
              ...value, 
              min: parseInt(e.target.value) || 18 
            })}
            className="w-20"
          />
        </div>
        <span>até</span>
        <div>
          <Label htmlFor="ageMax" className="text-sm">Máx.</Label>
          <Input 
            id="ageMax"
            type="number" 
            min="13" 
            max="65"
            value={value.max}
            onChange={(e) => onChange({ 
              ...value, 
              max: parseInt(e.target.value) || 65 
            })}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};
