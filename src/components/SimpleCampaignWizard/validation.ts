import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';

export const validateStep4Location = (formData: SimpleCampaignFormData) => {
  // Verificar se tem selected_locations
  if (!formData.selected_locations || formData.selected_locations.length === 0) {
    return { 
      isValid: false, 
      message: 'Selecione pelo menos uma cidade ou estado' 
    };
  }
  
  // ✅ Validar limite máximo Meta API
  if (formData.selected_locations.length > 50) {
    return { 
      isValid: false, 
      message: 'Máximo de 50 localizações permitidas pela Meta API' 
    };
  }
  
  // Validar cada location
  for (const loc of formData.selected_locations) {
    // Region DEVE ter key Meta
    if (loc.type === 'region' && !loc.key) {
      return { 
        isValid: false, 
        message: `Estado "${loc.name}" inválido (faltando Meta key)` 
      };
    }
    
    // City deve ter lat/lng OU key
    if (loc.type === 'city' && !loc.latitude && !loc.key) {
      return { 
        isValid: false, 
        message: `Cidade "${loc.name}" inválida (faltando coordenadas ou key)` 
      };
    }
  }
  
  return { isValid: true };
};
