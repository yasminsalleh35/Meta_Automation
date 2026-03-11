
import React from 'react';
import { LocationSettingsData } from '@/types/locationSettings';

interface LocationSummaryProps {
  location: LocationSettingsData;
  selectedLocations: Array<{
    id: string;
    name: string;
    type: string;
    targeting: any;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
}

export const LocationSummary: React.FC<LocationSummaryProps> = ({
  location,
  selectedLocations
}) => {
  if (selectedLocations.length === 0) return null;

  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <div className="text-sm font-medium text-blue-900 mb-1">
        Configuração de Localização:
      </div>
      <div className="text-sm text-blue-700">
        {selectedLocations.length} localização{selectedLocations.length > 1 ? 'ões' : ''} selecionada{selectedLocations.length > 1 ? 's' : ''}
        {location.radius && ` com raio de ${location.radius}km`}
      </div>
      <div className="text-xs text-blue-600 mt-1">
        {selectedLocations.map(loc => loc.name).join(', ')}
      </div>
    </div>
  );
};
