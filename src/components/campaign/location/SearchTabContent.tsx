
import React from 'react';
import { LocationSearchInput } from '../LocationSearchInput';
import { RadiusControl } from './RadiusControl';
import { LocationSettingsData } from '@/types/locationSettings';

interface SearchTabContentProps {
  location: LocationSettingsData;
  selectedLocations: Array<{
    id: string;
    name: string;
    type: 'country' | 'region' | 'city' | 'zip';
    key: string;
    country_code?: string;
    region?: string;
    radius?: number;
    distance_unit?: 'kilometer' | 'mile';
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
  onLocationAdd: (location: any) => void;
  onLocationRemove: (locationId: string) => void;
  onMapUpdate: (coordinates: { lat: number; lng: number }, address: string) => void;
  metaAdsAccessToken?: string;
}

export const SearchTabContent: React.FC<SearchTabContentProps> = ({
  location,
  selectedLocations,
  onLocationChange,
  onLocationAdd,
  onLocationRemove,
  onMapUpdate,
  metaAdsAccessToken
}) => {
  const handleLocationAdd = async (newLocation: any) => {
    await onLocationAdd(newLocation);
    
    if (newLocation.coordinates) {
      onMapUpdate(newLocation.coordinates, newLocation.name);
    }
  };

  return (
    <div className="space-y-6">
      <LocationSearchInput
        selectedLocations={selectedLocations}
        onLocationAdd={handleLocationAdd}
        onLocationRemove={onLocationRemove}
        onMapUpdate={onMapUpdate}
        accessToken={metaAdsAccessToken}
      />

      <RadiusControl 
        location={location}
        onLocationChange={onLocationChange}
      />
    </div>
  );
};
