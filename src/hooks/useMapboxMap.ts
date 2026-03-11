
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinates } from '@/types/locationMap';
import { getAddressFromCoordinates } from '@/utils/mapboxUtils';

interface UseMapboxMapProps {
  mapboxToken: string | null;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  onMapUpdate?: (coordinates: { lat: number; lng: number }, address: string) => void;
  initialLocation?: Coordinates;
}

export const useMapboxMap = ({
  mapboxToken,
  onLocationSelect,
  onMapUpdate,
  initialLocation
}: UseMapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const defaultLocation = { lat: -14.2350, lng: -51.9253 };

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCoords = initialLocation || defaultLocation;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCoords.lng, initialCoords.lat],
      zoom: initialLocation ? 12 : 4
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      console.log('Map loaded');
    });

    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      const address = await getAddressFromCoordinates(lat, lng, mapboxToken);
      
      onLocationSelect?.({ lat, lng, address });
      onMapUpdate?.({ lat, lng }, address);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  return {
    mapContainer,
    map: map.current,
    markers: markers.current,
    isLoaded
  };
};
