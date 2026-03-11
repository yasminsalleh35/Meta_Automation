
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { LocationTargetingPreview } from './LocationTargetingPreview';
import { SearchTabContent } from './location/SearchTabContent';
import { useLocationSettingsHandlers } from '@/hooks/useLocationSettingsHandlers';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { LocationSettingsData } from '@/types/locationSettings';

interface LocationSettingsProps {
  location: LocationSettingsData;
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
}

export const LocationSettings: React.FC<LocationSettingsProps> = ({
  location,
  onLocationChange
}) => {
  const [isTargetingValid, setIsTargetingValid] = useState<boolean>(true);
  const { existingIntegration } = useMetaAdsIntegration();

  const {
    selectedLocations,
    handleLocationAdd,
    handleLocationRemove,
    handleMapUpdate
  } = useLocationSettingsHandlers({ location, onLocationChange });

  // Get access token from existing integration
  const metaAdsAccessToken = existingIntegration?.access_token;

  // Ensure all locations have required id property for the SearchTabContent interface
  const locationsWithIds = selectedLocations.map(loc => ({
    ...loc,
    id: loc.id || `${loc.key}-${Date.now()}`
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Localização</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchTabContent
            location={location}
            selectedLocations={locationsWithIds}
            onLocationChange={onLocationChange}
            onLocationAdd={handleLocationAdd}
            onLocationRemove={handleLocationRemove}
            onMapUpdate={handleMapUpdate}
            metaAdsAccessToken={metaAdsAccessToken}
          />
        </CardContent>
      </Card>

      <LocationTargetingPreview
        location={location}
        onValidationChange={setIsTargetingValid}
      />
    </div>
  );
};
