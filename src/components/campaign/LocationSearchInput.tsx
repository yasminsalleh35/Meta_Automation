
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, X, Loader2, AlertTriangle } from 'lucide-react';
import { metaAdsLocationService } from '@/services/metaAds/MetaAdsLocationService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationSearchInputProps {
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
  onLocationAdd: (location: any) => void;
  onLocationRemove: (locationId: string) => void;
  onMapUpdate?: (coordinates: { lat: number; lng: number }, address: string) => void;
  accessToken?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  selectedLocations,
  onLocationAdd,
  onLocationRemove,
  onMapUpdate,
  accessToken
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchLocations = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setError(null);
        return;
      }

      if (!accessToken) {
        setError('Token de acesso do Meta Ads não disponível. Configure a integração primeiro.');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const results = await metaAdsLocationService.getLocationSuggestions(
          searchQuery,
          accessToken
        );
        
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching locations:', error);
        setError('Erro ao buscar localizações. Verifique sua conexão.');
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, accessToken]);

  const handleLocationSelect = (suggestion: any) => {
    console.log('🔧 Processing location selection:', {
      suggestion,
      hasKey: !!suggestion.key,
      type: suggestion.type
    });

    // Validar se tem Meta ID
    if (!suggestion.key) {
      console.error('❌ ERRO: Location missing Meta ID (key):', suggestion);
      setError('Localização inválida selecionada. Tente outra opção.');
      return;
    }

    const newLocation = {
      id: suggestion.id || `${suggestion.key}_${Date.now()}`,
      key: suggestion.key, // Meta API ID - obrigatório
      name: suggestion.display_name || suggestion.name,
      type: suggestion.type || 'city',
      country_code: suggestion.country_code,
      region: suggestion.region,
      // Adicionar radius padrão para cidades
      radius: suggestion.type === 'city' ? (suggestion.radius || 10) : undefined,
      distance_unit: suggestion.type === 'city' ? (suggestion.distance_unit || 'kilometer') : undefined,
      coordinates: suggestion.coordinates
    };

    console.log('✅ Final location object to add:', {
      id: newLocation.id,
      key: newLocation.key,
      name: newLocation.name,
      type: newLocation.type,
      hasValidKey: !!newLocation.key
    });

    try {
      onLocationAdd(newLocation);

      if (newLocation.coordinates && onMapUpdate) {
        onMapUpdate(newLocation.coordinates, newLocation.name);
      }

      setSearchQuery('');
      setShowSuggestions(false);
      setError(null);
    } catch (error) {
      console.error('Error adding location:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar localização');
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={!accessToken ? "Configure a integração Meta Ads primeiro..." : "Digite o nome da cidade ou região..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            disabled={!accessToken}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
          )}
        </div>

        {/* Erro de integração */}
        {!accessToken && (
          <Alert className="mt-2 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Integração com Meta Ads necessária para buscar localizações. Configure em Integrações.
            </AlertDescription>
          </Alert>
        )}

        {/* Erro geral */}
        {error && accessToken && (
          <Alert className="mt-2 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                onClick={() => handleLocationSelect(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.display_name || suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.type === 'city' ? 'Cidade' : 
                     suggestion.type === 'region' ? 'Estado/Região' : 
                     suggestion.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de localizações selecionadas */}
      {selectedLocations.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Localizações selecionadas:
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((location) => (
              <Badge
                key={location.id}
                variant="secondary"
                className="flex items-center space-x-2 px-3 py-1"
              >
                <span className="text-sm">
                  {location.name}
                  {location.type === 'city' && location.radius && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({location.radius}km)
                    </span>
                  )}
                </span>
                <button
                  onClick={() => onLocationRemove(location.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && !isLoading && !error && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Nenhuma localização encontrada para "{searchQuery}"
        </div>
      )}
    </div>
  );
};
