import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin, Loader2, Globe, Search, X, AlertCircle } from 'lucide-react';
import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';
import { getCitySuggestions } from '@/utils/mapboxUtils';
import { metaAdsLocationService } from '@/services/metaAdsService';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useMapbox } from '@/contexts/MapboxContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

interface Step4LocalProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  text: string;
  context?: Array<{ id: string; text: string }>;
}

// ✅ Lista inicial de países
const INITIAL_COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
];

// ✅ Limite máximo Meta API
const MAX_LOCATIONS = 50;

export const Step4Local: React.FC<Step4LocalProps> = ({ formData, updateFormData }) => {
  const { toast } = useToast();
  
  // ✅ Modo de targeting: cidade ou região
  const [targetingMode, setTargetingMode] = useState<'city' | 'region'>('city');
  
  // Estados para cidade
  const [countryCode, setCountryCode] = useState<string>(formData.countryCode || 'BR');
  const [cityQuery, setCityQuery] = useState(formData.city || '');
  const [citySuggestions, setCitySuggestions] = useState<Array<MapboxFeature & { country_code?: string }>>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(formData.city || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ Estados para região/estado
  const [regionQuery, setRegionQuery] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<any[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const { existingIntegration } = useMetaAdsIntegration();
  const metaAccessToken = existingIntegration?.access_token;
  
  const { mapboxToken } = useMapbox();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const regionDebounceTimerRef = useRef<NodeJS.Timeout>();
  const regionAbortControllerRef = useRef<AbortController>();

  // ✅ Sincronizar countryCode com formData
  useEffect(() => {
    if (formData.countryCode !== countryCode) {
      updateFormData('countryCode', countryCode);
    }
  }, [countryCode]);

  // ✅ Buscar sugestões de cidades com debounce e cancelamento
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancelar busca anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce 300ms
    debounceTimerRef.current = setTimeout(async () => {
      if (!mapboxToken) {
        console.warn('⚠️ Mapbox token não configurado');
        return;
      }

      setIsLoadingCities(true);
      abortControllerRef.current = new AbortController();

      try {
        // ✅ Busca com filtro de país dinâmico
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityQuery)}.json?` +
                    `access_token=${mapboxToken}&types=place&limit=10&country=${countryCode}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          const features = data.features || [];
          setCitySuggestions(features);
          setShowSuggestions(features.length > 0);
          console.log(`✅ Mapbox: ${features.length} cidades encontradas para ${countryCode}`);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ Erro ao buscar cidades:', error);
        }
      } finally {
        setIsLoadingCities(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cityQuery, countryCode, mapboxToken]);

  // ✅ Selecionar cidade (ADICIONAR ao array)
  const handleCitySelect = async (suggestion: MapboxFeature) => {
    const currentLocations = formData.selected_locations || [];
    
    // ✅ Validar limite máximo
    if (currentLocations.length >= MAX_LOCATIONS) {
      toast({
        title: "⚠️ Limite atingido",
        description: `Máximo de ${MAX_LOCATIONS} localizações permitidas`,
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    const [lng, lat] = suggestion.center;
    const cityName = suggestion.text;
    const region = suggestion.context?.find(c => c.id.startsWith('region'))?.text || '';
    const countryName = suggestion.context?.find(c => c.id.startsWith('country'))?.text || '';
    
    const displayLabel = [cityName, region, countryName].filter(Boolean).join(', ');
    
    // ✅ Atualizar form com dados legados (apenas para compatibilidade)
    updateFormData('city', displayLabel);
    updateFormData('cityCoordinates', {
      latitude: lat,
      longitude: lng,
      center: [lng, lat]
    });

    console.log(`📍 Cidade selecionada: ${displayLabel} (${countryCode})`);

    // ✅ Criar nova localização
    const newLocation = {
      name: cityName,
      type: 'city' as const,
      country_code: countryCode,
      region: region || null,
      latitude: lat,
      longitude: lng,
      radius: formData.radius || 10,
      distance_unit: 'kilometer' as const
    };
    
    // ✅ Evitar duplicatas
    const isDuplicate = currentLocations.some(
      loc => loc.name === cityName && loc.type === 'city'
    );
    
    if (!isDuplicate) {
      updateFormData('selected_locations', [...currentLocations, newLocation]);
      toast({
        title: "✅ Cidade adicionada",
        description: `${cityName} foi adicionada (Total: ${currentLocations.length + 1})`,
        duration: 2000
      });
      console.log(`✅ Cidade adicionada: ${cityName} (Total: ${currentLocations.length + 1})`);
    } else {
      toast({
        title: "⚠️ Cidade já adicionada",
        description: `${cityName} já está na sua lista`,
        variant: "destructive",
        duration: 2000
      });
      console.warn(`⚠️ Cidade "${cityName}" já foi adicionada`);
    }
    
    // ✅ Limpar campo de busca
    setCityQuery('');
    setShowSuggestions(false);
  };

  // ✅ Limpar seleção
  const handleClearCity = () => {
    setCityQuery('');
    setSelectedCity('');
    setShowSuggestions(false);
    updateFormData('city', '');
    updateFormData('cityCoordinates', null);
    updateFormData('selected_locations', []);
  };

  // ✅ FASE 1: Buscar regiões/estados via Meta API oficial (com fallback Mapbox)
  useEffect(() => {
    if (targetingMode !== 'region' || !regionQuery || regionQuery.length < 2) {
      setRegionSuggestions([]);
      return;
    }

    // Cancelar busca anterior
    if (regionAbortControllerRef.current) {
      regionAbortControllerRef.current.abort();
    }

    // Limpar timer anterior
    if (regionDebounceTimerRef.current) {
      clearTimeout(regionDebounceTimerRef.current);
    }

    // Debounce 300ms
    regionDebounceTimerRef.current = setTimeout(async () => {
      setIsLoadingRegions(true);
      regionAbortControllerRef.current = new AbortController();

      try {
        // ✅ PRIORIDADE 1: Tentar Meta API oficial (se token disponível)
        if (metaAccessToken) {
          console.log(`🔍 [META-API] Buscando estados via Meta API oficial: ${regionQuery} (${countryCode})`);
          
          try {
            const metaResults = await metaAdsLocationService.getLocationSuggestions(
              regionQuery,
              metaAccessToken,
              countryCode,
              ['region']
            );

            if (metaResults && metaResults.length > 0) {
              console.log(`✅ [META-API] ${metaResults.length} estados encontrados com key oficial`, {
                query: regionQuery,
                country: countryCode,
                results: metaResults.map(r => ({ name: r.name, key: r.key, type: r.type }))
              });
              
              // ✅ Converter formato Meta API para formato compatível com UI
              const formattedResults = metaResults.map(result => ({
                text: result.name,
                place_name: result.region ? `${result.name}, ${result.region}` : result.name,
                center: [0, 0], // Meta API não retorna coordenadas precisas
                context: [
                  { id: `region.${result.key}`, text: result.name },
                  { id: `country.${result.country_code}`, text: result.country_code }
                ],
                meta_key: result.key, // ✅ CRÍTICO: Key oficial da Meta API
                source: 'meta_api'
              }));

              setRegionSuggestions(formattedResults);
              setIsLoadingRegions(false);
              return; // ✅ Sucesso Meta API - não precisa fallback
            }
          } catch (metaError) {
            console.warn('⚠️ [META-API] Erro na busca Meta API, usando fallback Mapbox:', metaError);
          }
        } else {
          console.log('ℹ️ [META-API] Token Meta não disponível, usando Mapbox');
        }

        // ✅ FALLBACK: Usar Mapbox se Meta API falhar ou não disponível
        if (!mapboxToken) {
          console.warn('⚠️ Nenhum token disponível (Meta API ou Mapbox)');
          setIsLoadingRegions(false);
          return;
        }

        console.log(`🔍 [MAPBOX-FALLBACK] Buscando estados via Mapbox: ${regionQuery} (${countryCode})`);
        
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(regionQuery)}.json?` +
                    `access_token=${mapboxToken}&types=region&limit=10&country=${countryCode}`;

        const response = await fetch(url, {
          signal: regionAbortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          const features = data.features || [];
          
          console.log(`✅ [MAPBOX-FALLBACK] ${features.length} estados encontrados (sem key Meta oficial)`, {
            query: regionQuery,
            country: countryCode,
            results: features.map((f: MapboxFeature) => f.place_name)
          });
          
          // Marcar como fonte Mapbox
          const featuresWithSource = features.map((f: any) => ({ ...f, source: 'mapbox' }));
          setRegionSuggestions(featuresWithSource);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ Erro ao buscar estados:', error);
        }
      } finally {
        setIsLoadingRegions(false);
      }
    }, 300);

    return () => {
      if (regionDebounceTimerRef.current) {
        clearTimeout(regionDebounceTimerRef.current);
      }
      if (regionAbortControllerRef.current) {
        regionAbortControllerRef.current.abort();
      }
    };
  }, [regionQuery, countryCode, mapboxToken, metaAccessToken, targetingMode]);

  // ✅ Selecionar região/estado (ADICIONAR ao array)
  const handleRegionSelect = (suggestion: any) => {
    const currentLocations = formData.selected_locations || [];
    
    // ✅ Validar limite máximo
    if (currentLocations.length >= MAX_LOCATIONS) {
      toast({
        title: "⚠️ Limite atingido",
        description: `Máximo de ${MAX_LOCATIONS} localizações permitidas`,
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    const regionName = suggestion.text;
    const countryName = suggestion.context?.find((c: any) => c.id.startsWith('country'))?.text || '';
    const displayLabel = [regionName, countryName].filter(Boolean).join(', ');
    
    // ✅ CRITICAL: Detectar se tem key Meta oficial
    const hasMetaKey = !!suggestion.meta_key;
    const source = suggestion.source || 'unknown';
    
    console.log(`📍 Estado selecionado: ${displayLabel} (${countryCode})`, {
      hasMetaKey,
      metaKey: suggestion.meta_key || 'N/A',
      source,
      willUseOfficialTargeting: hasMetaKey
    });

    // ✅ Atualizar campos legados para validação funcionar
    const [lng, lat] = suggestion.center || [0, 0];
    updateFormData('city', displayLabel);
    updateFormData('cityCoordinates', {
      latitude: lat,
      longitude: lng,
      center: [lng, lat]
    });

    // ✅ Criar nova localização
    const newLocation: any = {
      name: regionName,
      type: 'region' as const,
      country_code: countryCode,
      source: suggestion.source || 'unknown'
    };
    
    // ✅ Adicionar key Meta se disponível
    if (hasMetaKey) {
      newLocation.key = suggestion.meta_key;
      console.log(`✅ [OFFICIAL-TARGETING] Estado com key Meta oficial: ${suggestion.meta_key}`);
    } else {
      newLocation.latitude = lat;
      newLocation.longitude = lng;
      newLocation.radius = 80;
      newLocation.distance_unit = 'kilometer';
      console.warn(`⚠️ [FALLBACK-TARGETING] Estado sem key Meta (Mapbox)`);
    }
    
    // ✅ Evitar duplicatas
    const isDuplicate = currentLocations.some(
      loc => loc.name === regionName && loc.type === 'region'
    );
    
    if (!isDuplicate) {
      updateFormData('selected_locations', [...currentLocations, newLocation]);
      toast({
        title: "✅ Estado adicionado",
        description: `${regionName} foi adicionado (Total: ${currentLocations.length + 1})`,
        duration: 2000
      });
      console.log(`✅ Estado adicionado: ${regionName} (Total: ${currentLocations.length + 1})`);
    } else {
      toast({
        title: "⚠️ Estado já adicionado",
        description: `${regionName} já está na sua lista`,
        variant: "destructive",
        duration: 2000
      });
      console.warn(`⚠️ Estado "${regionName}" já foi adicionado`);
    }
    
    // ✅ Limpar campo de busca
    setRegionQuery('');
    setRegionSuggestions([]);
  };

  // ✅ Atualizar radius
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    updateFormData('radius', newRadius);
    
    // ✅ Sincronizar radius em selected_locations (apenas para cidades)
    if (formData.selected_locations && formData.selected_locations.length > 0) {
      const updated = formData.selected_locations.map(loc => ({
        ...loc,
        radius: loc.type === 'city' ? newRadius : undefined
      }));
      updateFormData('selected_locations', updated);
    }
  };

  // ✅ Remover localização específica
  const handleRemoveLocation = (locationName: string, locationType: string) => {
    const currentLocations = formData.selected_locations || [];
    const updated = currentLocations.filter(
      loc => !(loc.name === locationName && loc.type === locationType)
    );
    updateFormData('selected_locations', updated);
    toast({
      title: "🗑️ Localização removida",
      description: `${locationName} foi removida`,
      duration: 2000
    });
    console.log(`🗑️ Localização removida: ${locationName} (${locationType})`);
  };

  // ✅ Limpar todas as localizações
  const handleClearAllLocations = () => {
    updateFormData('selected_locations', []);
    setCityQuery('');
    setRegionQuery('');
    setSelectedCity('');
    setSelectedRegion(null);
    toast({
      title: "🗑️ Localizações limpas",
      description: "Todas as localizações foram removidas",
      duration: 2000
    });
    console.log('🗑️ Todas as localizações removidas');
  };

  const selectedCountry = INITIAL_COUNTRIES.find(c => c.code === countryCode) || INITIAL_COUNTRIES[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização
          </CardTitle>
          <CardDescription>
            {formData.selected_locations && formData.selected_locations.length > 0 ? (
              <>
                ✅ {formData.selected_locations.length} localização(ões) selecionada(s)
                {' • '}
                <span className="text-muted-foreground">
                  Adicione mais cidades ou estados abaixo
                </span>
              </>
            ) : (
              'Selecione as cidades e/ou estados onde seu anúncio será exibido'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ Lista de localizações selecionadas */}
          {formData.selected_locations && formData.selected_locations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Localizações Selecionadas ({formData.selected_locations.length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllLocations}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Limpar todas
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.selected_locations.map((location, index) => (
                  <Badge 
                    key={`${location.name}-${location.type}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    {location.type === 'city' ? (
                      <MapPin className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    <span className="text-sm font-medium">{location.name}</span>
                    {location.type === 'city' && location.radius && (
                      <span className="text-xs text-muted-foreground">
                        ({location.radius}km)
                      </span>
                    )}
                    {location.key && (
                      <span className="text-xs text-green-600" title="Meta API oficial">
                        ✓
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveLocation(location.name, location.type)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <Alert>
                <AlertDescription className="text-xs">
                  💡 <strong>Dica:</strong> Você pode adicionar múltiplas cidades e estados. 
                  Seu anúncio será exibido em TODAS as localizações selecionadas.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* ✅ País - Sempre visível */}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <span className="text-lg mr-1">{selectedCountry.flag}</span>
                  <span className="font-semibold">{selectedCountry.code}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {INITIAL_COUNTRIES.map((country) => (
                  <DropdownMenuItem
                    key={country.code}
                    onClick={() => {
                      setCountryCode(country.code);
                      handleClearCity();
                      setSelectedRegion(null);
                      setRegionQuery('');
                    }}
                  >
                    <span className="text-lg mr-2">{country.flag}</span>
                    <span>{country.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Tabs: Cidade vs Estado */}
          <Tabs value={targetingMode} onValueChange={(v) => setTargetingMode(v as 'city' | 'region')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="city">
                <MapPin className="w-4 h-4 mr-2" />
                Cidade Específica
              </TabsTrigger>
              <TabsTrigger value="region">
                <Globe className="w-4 h-4 mr-2" />
                Estado/Região
              </TabsTrigger>
            </TabsList>

            {/* Tab: Cidade Específica */}
            <TabsContent value="city" className="space-y-4">
              <Alert>
                <AlertDescription>
                  🏙️ Ideal para negócios locais. Defina uma cidade e o raio de alcance.
                </AlertDescription>
              </Alert>

              {!mapboxToken && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ Token Mapbox não configurado. Configure em Admin → Mapbox para habilitar busca de cidades.
                  </AlertDescription>
                </Alert>
              )}

              {/* Busca de cidade */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Digite o nome da cidade..."
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  disabled={!mapboxToken}
                  className="pl-9 pr-9"
                />
                {isLoadingCities && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {cityQuery && !isLoadingCities && (
                  <button
                    onClick={handleClearCity}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sugestões de cidades */}
              {showSuggestions && citySuggestions.length > 0 && (
                <div className="border rounded-md max-h-60 overflow-auto">
                  {citySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCitySelect(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2"
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span>{suggestion.place_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cidade selecionada */}
              {selectedCity && (
                <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedCity}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCountry.flag} {countryCode}
                  </Badge>
                </div>
              )}

              {/* Raio */}
              {selectedCity && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Raio de Alcance</label>
                    <span className="text-sm font-semibold text-primary">
                      {formData.radius} km
                    </span>
                  </div>
                  <Slider
                    value={[formData.radius]}
                    onValueChange={handleRadiusChange}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Seu anúncio será exibido em um raio de {formData.radius} km da cidade selecionada
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Estado/Região */}
            <TabsContent value="region" className="space-y-4">
              {/* ✅ FASE 1: Warning se Meta API não disponível */}
              {!metaAccessToken && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ <strong>Meta API não conectada.</strong> Targeting de estados usará coordenadas aproximadas (menos preciso). 
                    Conecte sua conta Meta em <strong>Integrações → Meta Ads</strong> para targeting oficial.
                  </AlertDescription>
                </Alert>
              )}
              
              {metaAccessToken && (
                <Alert>
                  <AlertDescription>
                    ✅ Meta API conectada. Estados serão segmentados com <strong>targeting oficial</strong> da Meta.
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <AlertDescription>
                  🗺️ Ideal para e-commerce e serviços. Seu anúncio será exibido em todo o estado.
                </AlertDescription>
              </Alert>

              {!mapboxToken && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ Token Mapbox não configurado. Configure em Admin → Mapbox para habilitar busca de estados.
                  </AlertDescription>
                </Alert>
              )}

              {/* Busca de estado */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Digite o nome do estado (ex: Florida, São Paulo)..."
                  value={regionQuery}
                  onChange={(e) => setRegionQuery(e.target.value)}
                  disabled={!mapboxToken}
                  className="pl-9 pr-9"
                />
                {isLoadingRegions && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

       {/* Sugestões de estados */}
       {regionSuggestions.length > 0 && (
         <div className="border rounded-md max-h-60 overflow-auto">
           {regionSuggestions.map((suggestion: MapboxFeature, index: number) => (
             <button
               key={index}
               onClick={() => handleRegionSelect(suggestion)}
               className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center gap-2"
             >
               <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
               <span>{suggestion.place_name}</span>
             </button>
           ))}
         </div>
       )}
       
       {/* ✅ Fallback: Nenhum resultado encontrado */}
       {regionQuery.length >= 2 && !isLoadingRegions && regionSuggestions.length === 0 && !selectedRegion && (
         <Alert>
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>
             Nenhum estado encontrado para "{regionQuery}" em {countryCode}.
             {countryCode === 'BR' && ' Tente: São Paulo, Minas Gerais, Rio de Janeiro'}
             {countryCode === 'US' && ' Try: Florida, Texas, California, New York'}
           </AlertDescription>
         </Alert>
       )}

              {/* Estado selecionado */}
              {selectedRegion && (
                <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedRegion}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCountry.flag} {countryCode}
                  </Badge>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
