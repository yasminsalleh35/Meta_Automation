
export class LocationDisplayService {
  // Format location for display
  formatLocationDisplay(location: any): string {
    if (location.countries) {
      return location.countries.includes('BR') ? 'Brasil' : 'País selecionado';
    }
    
    if (location.regions && location.regions.length > 0) {
      return `Estado (${location.regions.length} selecionado${location.regions.length > 1 ? 's' : ''})`;
    }
    
    if (location.cities && location.cities.length > 0) {
      return `Cidade${location.cities.length > 1 ? 's' : ''} (${location.cities.length} selecionada${location.cities.length > 1 ? 's' : ''})`;
    }
    
    if (location.custom_locations && location.custom_locations.length > 0) {
      return `Localização personalizada (${location.custom_locations.length} ponto${location.custom_locations.length > 1 ? 's' : ''})`;
    }
    
    return 'Localização personalizada';
  }
}

export const locationDisplayService = new LocationDisplayService();
