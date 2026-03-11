
import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxMap } from '@/hooks/useMapboxMap';
import { LocationMapProps, Coordinates } from '@/types/locationMap';
import { 
  geocodeLocation, 
  addMarker, 
  addRadiusCircle, 
  clearMarkersAndCircles 
} from '@/utils/mapboxUtils';

export const LocationMap: React.FC<LocationMapProps> = ({
  onLocationSelect,
  initialLocation,
  selectedLocations = [],
  onMapUpdate,
  radius = 10,
  showRadius = true,
  locationForGeocoding
}) => {
  const [geocodedLocation, setGeocodedLocation] = useState<Coordinates | null>(null);
  const [locationsWithCoords, setLocationsWithCoords] = useState<any[]>([]);
  const { mapboxToken } = useMapbox();

  const { mapContainer, map, markers, isLoaded } = useMapboxMap({
    mapboxToken,
    onLocationSelect,
    onMapUpdate,
    initialLocation
  });

  // Geocode locations that don't have coordinates
  useEffect(() => {
    const geocodeSelectedLocations = async () => {
      if (!mapboxToken || selectedLocations.length === 0) {
        setLocationsWithCoords(selectedLocations);
        return;
      }

      console.log('Processing selected locations for geocoding:', selectedLocations);
      
      const processedLocations = await Promise.all(
        selectedLocations.map(async (location) => {
          if (location.coordinates) {
            console.log('Location already has coordinates:', location.name, location.coordinates);
            return location;
          }

          console.log('Geocoding location without coordinates:', location.name);
          const geocoded = await geocodeLocation(location.name, mapboxToken);
          if (geocoded) {
            console.log('Successfully geocoded:', location.name, 'to:', geocoded);
            return {
              ...location,
              coordinates: geocoded
            };
          }

          console.log('Failed to geocode:', location.name);
          return location;
        })
      );

      setLocationsWithCoords(processedLocations);
    };

    geocodeSelectedLocations();
  }, [selectedLocations, mapboxToken]);

  // Geocode location by name for fallback
  useEffect(() => {
    const performGeocoding = async () => {
      if (locationForGeocoding && locationsWithCoords.length === 0 && !initialLocation && mapboxToken) {
        console.log('Geocoding fallback location:', locationForGeocoding);
        const coords = await geocodeLocation(locationForGeocoding, mapboxToken);
        if (coords) {
          console.log('Geocoded fallback location:', coords);
          setGeocodedLocation(coords);
        }
      } else {
        setGeocodedLocation(null);
      }
    };

    performGeocoding();
  }, [locationForGeocoding, locationsWithCoords, initialLocation, mapboxToken]);

  // Update map when locations change
  useEffect(() => {
    if (!map || !isLoaded) return;

    console.log('Updating map with processed locations:', {
      locationsWithCoords,
      initialLocation,
      geocodedLocation,
      radius
    });

    clearMarkersAndCircles(markers, map);

    let centerCoords: Coordinates | null = null;
    let shouldFitBounds = false;
    const bounds = new mapboxgl.LngLatBounds();
    const validLocations = locationsWithCoords.filter(loc => loc.coordinates);

    if (validLocations.length > 0) {
      console.log('Processing', validLocations.length, 'valid locations with coordinates');
      
      validLocations.forEach((location, index) => {
        const { lat, lng } = location.coordinates!;
        console.log(`Adding marker ${index} for ${location.name} at:`, { lat, lng });
        
        const marker = addMarker(map, lat, lng, location.name, index, showRadius, radius);
        markers.push(marker);
        
        bounds.extend([lng, lat]);
        shouldFitBounds = true;
        
        if (showRadius && radius > 0) {
          addRadiusCircle(map, lat, lng, radius, index);
        }

        if (validLocations.length === 1) {
          centerCoords = { lat, lng };
        }
      });
    } else if (initialLocation) {
      const { lat, lng } = initialLocation;
      console.log('Using initial location for marker:', { lat, lng });
      const marker = addMarker(map, lat, lng, 'Localização inicial', 0, showRadius, radius);
      markers.push(marker);
      
      if (showRadius && radius > 0) {
        addRadiusCircle(map, lat, lng, radius, 0);
      }
      centerCoords = { lat, lng };
    } else if (geocodedLocation) {
      const { lat, lng } = geocodedLocation;
      console.log('Using geocoded location for marker:', { lat, lng });
      const marker = addMarker(map, lat, lng, locationForGeocoding || 'Localização', 0, showRadius, radius);
      markers.push(marker);
      
      if (showRadius && radius > 0) {
        addRadiusCircle(map, lat, lng, radius, 0);
      }
      centerCoords = { lat, lng };
    }

    // Center map appropriately
    if (shouldFitBounds && validLocations.length > 1) {
      console.log('Fitting bounds for multiple locations');
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    } else if (centerCoords) {
      console.log('Centering map on single location:', centerCoords);
      map.flyTo({
        center: [centerCoords.lng, centerCoords.lat],
        zoom: 12,
        duration: 1000
      });
    } else {
      console.log('No valid coordinates found for centering');
    }
  }, [locationsWithCoords, initialLocation, geocodedLocation, isLoaded, radius, showRadius, locationForGeocoding, map, markers]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Token do Mapbox não configurado</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
