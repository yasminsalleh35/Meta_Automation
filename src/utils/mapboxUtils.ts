
import mapboxgl from 'mapbox-gl';

export const createCircle = (center: [number, number], radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> => {
  const points = 64;
  const km = radiusKm;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = km / 110.54;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([center[0] + x, center[1] + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ret]
    }
  };
};

export const geocodeLocation = async (locationName: string, mapboxToken: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    console.log('Geocoding location:', locationName);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?country=br&access_token=${mapboxToken}&language=pt`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      console.log('Geocoded coordinates:', { lat, lng });
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};

export const getCitySuggestions = async (query: string, mapboxToken: string): Promise<Array<{
  place_name: string;
  center: [number, number];
  text: string;
}>> => {
  try {
    if (!query || query.length < 2) return [];
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=br&types=place&access_token=${mapboxToken}&language=pt-BR&limit=5`
    );

    if (!response.ok) {
      console.error('❌ Mapbox suggestions API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map((feature: any) => ({
        place_name: feature.place_name,
        center: feature.center,
        text: feature.text
      }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error getting city suggestions:', error);
    return [];
  }
};

export const getAddressFromCoordinates = async (lat: number, lng: number, mapboxToken: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=pt`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const addMarker = (
  map: mapboxgl.Map,
  lat: number,
  lng: number,
  title: string,
  index: number,
  showRadius: boolean,
  radius: number
): mapboxgl.Marker => {
  console.log('Adding marker:', { lat, lng, title, index });

  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
    `<div class="p-2">
      <div class="font-medium">${title}</div>
      <div class="text-sm text-gray-600">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
      ${showRadius && radius > 0 ? `<div class="text-xs text-gray-500">Raio: ${radius}km</div>` : ''}
    </div>`
  );

  const marker = new mapboxgl.Marker({
    color: index === 0 ? '#3b82f6' : '#10b981'
  })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);

  return marker;
};

export const addRadiusCircle = (
  map: mapboxgl.Map,
  lat: number,
  lng: number,
  radiusKm: number,
  index: number
): void => {
  if (radiusKm <= 0) return;

  console.log('Adding radius circle:', { lat, lng, radiusKm, index });

  const sourceId = `radius-${index}`;
  const layerId = `${sourceId}-layer`;
  const borderLayerId = `${sourceId}-border`;

  const circle = createCircle([lng, lat], radiusKm);

  map.addSource(sourceId, {
    type: 'geojson',
    data: circle
  });

  map.addLayer({
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': index === 0 ? '#3b82f6' : '#10b981',
      'fill-opacity': 0.1
    }
  });

  map.addLayer({
    id: borderLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': index === 0 ? '#3b82f6' : '#10b981',
      'line-width': 2,
      'line-opacity': 0.5
    }
  });
};

export const clearMarkersAndCircles = (markers: mapboxgl.Marker[], map: mapboxgl.Map): void => {
  markers.forEach(marker => marker.remove());
  markers.length = 0;
  
  if (map.getSource) {
    for (let i = 0; i < 10; i++) {
      const sourceId = `radius-${i}`;
      if (map.getSource(sourceId)) {
        map.removeLayer(`${sourceId}-layer`);
        map.removeLayer(`${sourceId}-border`);
        map.removeSource(sourceId);
      }
    }
  }
};
