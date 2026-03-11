
import React, { useEffect, useState } from 'react';
import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LocationSettings } from '@/components/campaign/LocationSettings';
import { CampaignData } from '@/types/campaign';
import { LocationDataValidator } from '@/services/location/LocationDataValidator';
import { useToast } from '@/hooks/use-toast';
import { LocationSettingsData } from '@/types/locationSettings';

interface LocationWizardStepProps {
  campaignData: CampaignData;
  updateLocationData: (field: keyof LocationSettingsData, value: any) => void;
  onAISuggestion?: () => void;
  isAILoading?: boolean;
  handleApplySuggestions?: (suggestions: any) => void;
  aiSuggestions?: any;
  isLocationValid?: () => boolean;
  checkDataIntegrity?: () => any;
  forceDataSync?: () => void;
  validateStepData?: (step: number) => boolean;
  emergencyLocationRecovery?: () => boolean;
}

export const LocationWizardStep: React.FC<LocationWizardStepProps> = ({
  campaignData,
  updateLocationData,
  isLocationValid
}) => {
  const { toast } = useToast();
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    errors: any[];
    lastCheck: number;
  }>({
    isValid: false,
    errors: [],
    lastCheck: 0
  });

  const hasSelectedLocations = campaignData.location.selectedLocations.length > 0;
  
  // Convert CampaignData location to LocationSettingsData format
  const locationSettings: LocationSettingsData = {
    radius: campaignData.location.radius,
    coordinates: campaignData.location.coordinates,
    selectedAddress: campaignData.location.selectedAddress,
    selectedLocations: campaignData.location.selectedLocations.map(loc => ({
      id: loc.id || `${loc.key}-${Date.now()}`,
      name: loc.name,
      type: loc.type,
      key: loc.key,
      country_code: loc.country_code,
      region: loc.region,
      radius: loc.radius,
      distance_unit: loc.distance_unit,
      coordinates: loc.coordinates
    }))
  };
  
  // Real-time validation
  useEffect(() => {
    const performValidation = () => {
      const errors = LocationDataValidator.validateLocationData(campaignData);
      const isValid = errors.length === 0;
      
      setValidationState({
        isValid,
        errors,
        lastCheck: Date.now()
      });

      // Auto-recovery attempt if validation fails
      if (!isValid && hasSelectedLocations === false) {
        const recoveryResult = LocationDataValidator.attemptLocationRecovery(campaignData);
        if (recoveryResult) {
          updateLocationData('selectedLocations', recoveryResult.selectedLocations);
          
          toast({
            title: "Localização recuperada",
            description: `Dados restaurados: ${recoveryResult.recoveryMethod}`,
            variant: "default"
          });
        }
      }
    };

    performValidation();
  }, [campaignData.location.selectedLocations, hasSelectedLocations, updateLocationData, toast]);

  // Determine current validation status
  let isValidLocation = false;
  try {
    isValidLocation = isLocationValid ? isLocationValid() : validationState.isValid;
  } catch (error) {
    isValidLocation = validationState.isValid;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-camply-blue" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Onde você quer que seu anúncio apareça?
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Escolha as cidades onde seus clientes estão localizados.
          </p>
        </div>
      </div>

      {/* Status display */}
      <div className="flex justify-center">
        <Badge 
          variant={isValidLocation ? "default" : "secondary"}
          className={`px-4 py-2 text-sm font-medium ${
            isValidLocation 
              ? 'bg-camply-blue text-white border-0' 
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          {isValidLocation ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-white" />
              <span>
                {campaignData.location.selectedLocations.length} localização(ões) selecionada(s)
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2 text-gray-600" />
              <span>Selecione uma cidade</span>
            </>
          )}
        </Badge>
      </div>

      {/* Selection guidance */}
      {!hasSelectedLocations && validationState.errors.length === 0 && (
        <Alert className="border-camply-blue/20 bg-blue-50">
          <MapPin className="h-4 w-4 text-camply-blue" />
          <AlertDescription className="text-camply-blue">
            Digite o nome da cidade no campo abaixo para começar.
          </AlertDescription>
        </Alert>
      )}

      {/* Success confirmation */}
      {hasSelectedLocations && isValidLocation && (
        <Alert className="border-camply-green/20 bg-green-50">
          <CheckCircle className="h-4 w-4 text-camply-green" />
          <AlertDescription className="text-camply-green">
            ✅ Localização configurada com sucesso! Você pode prosseguir para o próximo passo.
          </AlertDescription>
        </Alert>
      )}

      <LocationSettings
        location={locationSettings}
        onLocationChange={updateLocationData}
      />
    </div>
  );
};
