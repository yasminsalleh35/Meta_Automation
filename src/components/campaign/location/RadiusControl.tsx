
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LocationSettingsData } from '@/types/locationSettings';

interface RadiusControlProps {
  location: LocationSettingsData;
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
  id?: string;
  description?: string;
}

export const RadiusControl: React.FC<RadiusControlProps> = ({
  location,
  onLocationChange,
  id = "radius",
  description = "km ao redor das localizações selecionadas"
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Label htmlFor={id} className="text-sm font-medium whitespace-nowrap">
        Raio (km):
      </Label>
      <Input 
        id={id}
        type="number"
        value={location.radius}
        onChange={(e) => onLocationChange('radius', parseInt(e.target.value) || 10)}
        min="1"
        max="100"
        className="w-24"
      />
      <span className="text-sm text-gray-500">
        {description}
      </span>
    </div>
  );
};
