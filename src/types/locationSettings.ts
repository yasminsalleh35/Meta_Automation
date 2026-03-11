
import { LocationData } from './location';

export type { LocationData };

export interface LocationSettingsData {
  radius: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  selectedAddress?: string;
  selectedLocations: LocationData[];
}

export interface LocationSettingsProps {
  location: LocationSettingsData;
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
}
