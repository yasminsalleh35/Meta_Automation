
export interface LocationMapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  selectedLocations?: Array<{
    id: string;
    name: string;
    coordinates?: { lat: number; lng: number };
  }>;
  onMapUpdate?: (coordinates: { lat: number; lng: number }, address: string) => void;
  radius?: number;
  showRadius?: boolean;
  locationForGeocoding?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SelectedLocation {
  id: string;
  name: string;
  coordinates?: Coordinates;
}
