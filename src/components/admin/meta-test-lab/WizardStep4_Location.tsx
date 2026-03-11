import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Search, X, Loader2 } from 'lucide-react';
import { TestWizardFormData } from '@/types/testWizard.types';
import { useMapbox } from '@/contexts/MapboxContext';
import { metaAdsLocationService } from '@/services/metaAdsService';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';

interface WizardStep4LocationProps {
  formData: TestWizardFormData;
  updateFormData: (field: keyof TestWizardFormData, value: any) => void;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  text: string;
  context?: Array<{ id: string; text: string }>;
}

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
];

export const WizardStep4_Location: React.FC<WizardStep4LocationProps> = ({ formData, updateFormData }) => {
  const [targetingMode, setTargetingMode] = useState<'city' | 'region'>('city');
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<MapboxFeature[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Estados para região/estado
  const [regionQuery, setRegionQuery] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<any[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  
  const { mapboxToken } = useMapbox();
  const { existingIntegration } = useMetaAdsIntegration();
  const metaAccessToken = existingIntegration?.access_token;
  
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const regionDebounceTimerRef = useRef<NodeJS.Timeout>();
  const regionAbortControllerRef = useRef<AbortController>();

  // Buscar cidades com cancelamento
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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!mapboxToken) return;

      setIsLoadingCities(true);
      abortControllerRef.current = new AbortController();

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityQuery)}.json?` +
                    `access_token=${mapboxToken}&types=place&limit=10&country=${formData.countryCode}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          setCitySuggestions(data.features || []);
          setShowSuggestions(true);
          console.log(`✅ Mapbox: ${data.features?.length || 0} cidades encontradas para ${formData.countryCode}`);
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
  }, [cityQuery, formData.countryCode, mapboxToken]);

  // Buscar regiões/estados via Meta API oficial (com fallback Mapbox)
  useEffect(() => {
    if (targetingMode !== 'region' || !regionQuery || regionQuery.length < 2) {
      setRegionSuggestions([]);
      return;
    }

    // Cancelar busca anterior
    if (regionAbortControllerRef.current) {
      regionAbortControllerRef.current.abort();
    }

    if (regionDebounceTimerRef.current) {
      clearTimeout(regionDebounceTimerRef.current);
    }

    regionDebounceTimerRef.current = setTimeout(async () => {
      setIsLoadingRegions(true);
      regionAbortControllerRef.current = new AbortController();

      try {
        // PRIORIDADE 1: Tentar Meta API oficial (se token disponível)
        if (metaAccessToken) {
          console.log(`🔍 [META-API] Buscando estados via Meta API oficial: ${regionQuery} (${formData.countryCode})`);
          
          try {
            const metaResults = await metaAdsLocationService.getLocationSuggestions(
              regionQuery,
              metaAccessToken,
              formData.countryCode,
              ['region']
            );

            if (metaResults && metaResults.length > 0) {
              console.log(`✅ [META-API] ${metaResults.length} estados encontrados com key oficial`, {
                query: regionQuery,
                country: formData.countryCode,
                results: metaResults.map(r => ({ name: r.name, key: r.key, type: r.type }))
              });
              
              // Converter formato Meta API para formato compatível com UI
              const formattedResults = metaResults.map(result => ({
                text: result.name,
                place_name: result.region ? `${result.name}, ${result.region}` : result.name,
                center: [0, 0] as [number, number],
                context: [
                  { id: `region.${result.key}`, text: result.name },
                  { id: `country.${result.country_code}`, text: result.country_code }
                ],
                meta_key: result.key,
                source: 'meta_api'
              }));

              setRegionSuggestions(formattedResults);
              setIsLoadingRegions(false);
              return;
            }
          } catch (metaError) {
            console.warn('⚠️ [META-API] Erro na busca Meta API, usando fallback Mapbox:', metaError);
          }
        } else {
          console.log('ℹ️ [META-API] Token Meta não disponível, usando Mapbox');
        }

        // FALLBACK: Usar Mapbox se Meta API falhar ou não disponível
        if (!mapboxToken) {
          console.warn('⚠️ Nenhum token disponível (Meta API ou Mapbox)');
          setIsLoadingRegions(false);
          return;
        }

        console.log(`🔍 [MAPBOX-FALLBACK] Buscando estados via Mapbox: ${regionQuery} (${formData.countryCode})`);
        
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(regionQuery)}.json?` +
                    `access_token=${mapboxToken}&types=region&limit=10&country=${formData.countryCode}`;

        const response = await fetch(url, {
          signal: regionAbortControllerRef.current.signal
        });

        if (response.ok) {
          const data = await response.json();
          const features = data.features || [];
          
          console.log(`✅ [MAPBOX-FALLBACK] ${features.length} estados encontrados (sem key Meta oficial)`, {
            query: regionQuery,
            country: formData.countryCode,
            results: features.map((f: MapboxFeature) => f.place_name)
          });
          
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
  }, [regionQuery, formData.countryCode, mapboxToken, metaAccessToken, targetingMode]);

  const handleCitySelect = (suggestion: MapboxFeature) => {
    const [lng, lat] = suggestion.center;
    const cityName = suggestion.text;
    const region = suggestion.context?.find(c => c.id.startsWith('region'))?.text || '';
    const countryName = suggestion.context?.find(c => c.id.startsWith('country'))?.text || '';
    
    const displayLabel = [cityName, region, countryName].filter(Boolean).join(', ');
    
    setCityQuery(displayLabel);
    setShowSuggestions(false);
    
    updateFormData('city', displayLabel);
    updateFormData('cityCoordinates', {
      latitude: lat,
      longitude: lng,
      center: [lng, lat]
    });

    console.log(`📍 Cidade selecionada: ${displayLabel} (${formData.countryCode})`);

    updateFormData('selected_locations', [{
      name: cityName,
      type: 'city',
      country_code: formData.countryCode,
      region: region || null,
      latitude: lat,
      longitude: lng,
      radius: formData.radius || 10,
      distance_unit: 'kilometer'
    }]);

    console.log(`✅ Localização salva: ${cityName} (${formData.countryCode}) - lat: ${lat}, lng: ${lng}`);
  };

  const handleClearCity = () => {
    setCityQuery('');
    setShowSuggestions(false);
    updateFormData('city', '');
    updateFormData('cityCoordinates', null);
    updateFormData('selected_locations', []);
  };

  const handleRegionSelect = (suggestion: any) => {
    const regionName = suggestion.text;
    const countryName = suggestion.context?.find((c: any) => c.id.startsWith('country'))?.text || '';
    const displayLabel = [regionName, countryName].filter(Boolean).join(', ');
    
    setSelectedRegion(displayLabel);
    setRegionQuery(displayLabel);
    setRegionSuggestions([]);
    
    const hasMetaKey = !!suggestion.meta_key;
    const source = suggestion.source || 'unknown';
    
    console.log(`📍 Estado selecionado: ${displayLabel} (${formData.countryCode})`, {
      hasMetaKey,
      metaKey: suggestion.meta_key || 'N/A',
      source,
      willUseOfficialTargeting: hasMetaKey
    });

    const [lng, lat] = suggestion.center || [0, 0];
    updateFormData('city', displayLabel);
    updateFormData('cityCoordinates', {
      latitude: lat,
      longitude: lng,
      center: [lng, lat]
    });

    if (hasMetaKey) {
      updateFormData('selected_locations', [{
        name: regionName,
        type: 'region',
        country_code: formData.countryCode,
        key: suggestion.meta_key,
        source: 'meta_api'
      }]);
      
      console.log(`✅ [OFFICIAL-TARGETING] Estado salvo com key Meta oficial: ${suggestion.meta_key}`);
      console.log(`   → Backend usará: geo_locations.regions[{ key: "${suggestion.meta_key}" }]`);
    } else {
      updateFormData('selected_locations', [{
        name: regionName,
        type: 'region',
        country_code: formData.countryCode,
        latitude: lat,
        longitude: lng,
        radius: 80,
        distance_unit: 'kilometer',
        source: 'mapbox'
      }]);
      
      console.warn(`⚠️ [FALLBACK-TARGETING] Estado salvo SEM key Meta (Mapbox)`);
      console.log(`   → Backend usará: custom_locations[{ lat: ${lat}, lng: ${lng}, radius: 80km }]`);
    }

    console.log(`✅ Campos legados atualizados: city="${displayLabel}"`);
  };

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    updateFormData('radius', newRadius);
    
    if (formData.selected_locations && formData.selected_locations.length > 0) {
      const updated = formData.selected_locations.map(loc => ({
        ...loc,
        radius: loc.type === 'city' ? newRadius : undefined
      }));
      updateFormData('selected_locations', updated);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.code === formData.countryCode) || COUNTRIES[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Passo 4: Localização
        </CardTitle>
        <CardDescription>Defina onde seu anúncio será exibido</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* País */}
        <div className="space-y-2">
          <Label>País</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span className="text-lg mr-2">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
              {COUNTRIES.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => {
                    updateFormData('countryCode', country.code);
                    setCityQuery('');
                    setRegionQuery('');
                    setSelectedRegion(null);
                    updateFormData('city', '');
                    updateFormData('cityCoordinates', null);
                    updateFormData('selected_locations', []);
                  }}
                >
                  <span className="text-lg mr-2">{country.flag}</span>
                  <span>{country.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs: Cidade vs Estado */}
        <Tabs value={targetingMode} onValueChange={(v) => setTargetingMode(v as 'city' | 'region')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="city">
              <MapPin className="w-4 h-4 mr-2" />
              Cidade
            </TabsTrigger>
            <TabsTrigger value="region">
              <Globe className="w-4 h-4 mr-2" />
              Estado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="city" className="space-y-4">
            <Alert>
              <AlertDescription>
                🏙️ Ideal para negócios locais. Defina cidade e raio.
              </AlertDescription>
            </Alert>

            {/* Busca de cidade */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Digite o nome da cidade..."
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                disabled={!mapboxToken}
                className="pl-9"
              />
              {isLoadingCities && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>

            {/* Sugestões */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                {citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion.place_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cidade selecionada */}
            {formData.city && (
              <Badge variant="secondary" className="gap-2">
                <MapPin className="h-3 w-3" />
                {formData.city}
              </Badge>
            )}

            {/* Raio */}
            <div className="space-y-2">
              <Label>Raio: {formData.radius} km</Label>
              <Slider
                min={1}
                max={80}
                step={1}
                value={[formData.radius]}
                onValueChange={handleRadiusChange}
              />
              <p className="text-xs text-muted-foreground">
                Alcance máximo: 80km
              </p>
            </div>
          </TabsContent>

          <TabsContent value="region" className="space-y-4">
            <Alert>
              <AlertDescription>
                🗺️ Ideal para campanhas regionais. Meta API garante targeting preciso.
              </AlertDescription>
            </Alert>

            {/* Busca de região */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Digite o nome do estado/região..."
                value={regionQuery}
                onChange={(e) => setRegionQuery(e.target.value)}
                className="pl-9"
              />
              {isLoadingRegions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>

            {/* Sugestões de região */}
            {regionSuggestions.length > 0 && (
              <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                {regionSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleRegionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion.place_name}</span>
                      </div>
                      {suggestion.source === 'meta_api' && (
                        <Badge variant="outline" className="text-xs">
                          Meta API ✓
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Região selecionada */}
            {selectedRegion && (
              <Badge variant="secondary" className="gap-2">
                <Globe className="h-3 w-3" />
                {selectedRegion}
              </Badge>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
