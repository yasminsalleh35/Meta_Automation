
/**
 * Serviço de busca oficial de localização usando Meta API
 * Baseado na documentação: https://developers.facebook.com/docs/marketing-api/targeting-search
 */

import { supabase } from '@/integrations/supabase/client';

export class OfficialLocationSearchService {
  /**
   * Busca localizações usando o endpoint oficial do Meta
   * @param params Parâmetros de busca estruturados
   */
  async searchLocations(params: {
    query: string;
    accessToken?: string; // ignorado: token só no servidor (audit SEC-12)
    locationTypes?: Array<'city' | 'region' | 'country'>;
    countryCode?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    key: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer';
  }>> {
    const { 
      query, 
      locationTypes = ['city', 'region'],
      countryCode,
      limit = 25 
    } = params;
    console.log(`🔍 Searching official Meta locations for: "${query}"`, {
      locationTypes,
      countryCode,
      limit
    });
    
    // A busca roda no servidor (meta-targeting-search, type=adgeolocation): o navegador não
    // lê mais o access_token da integração (audit SEC-12).

    try {
      const { data, error } = await supabase.functions.invoke('meta-targeting-search', {
        body: {
          type: 'adgeolocation',
          q: query,
          location_types: locationTypes,
          country_code: countryCode,
          limit,
        },
      });

      if (error) {
        console.error('❌ Meta Location Search Error:', error);
        return [];
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      console.log(`✅ Meta API returned ${items.length} locations`);
      return this.processLocationResults(items);
    } catch (error) {
      console.error(`❌ Error searching Meta locations:`, error);
      return [];
    }
  }

  /**
   * Processa resultados da API para formato padronizado
   */
  private processLocationResults(results: any[]): Array<{
    id: string;
    key: string;
    name: string;
    type: 'city' | 'region' | 'country';
    country_code: string;
    region?: string | null;
    radius?: number;
    distance_unit?: 'kilometer';
  }> {
    return results.map((location, index) => {
      console.log(`📍 Processing location ${index + 1}:`, {
        name: location.name,
        type: location.type,
        key: location.key,
        country: location.country_code
      });

      return {
        id: location.key || `meta_${Date.now()}_${index}`,
        key: location.key,
        name: location.name,
        type: location.type as 'city' | 'region' | 'country',
        country_code: location.country_code,
        region: location.region || null,
        // Adicionar radius padrão para cidades
        radius: location.type === 'city' ? 10 : undefined,
        distance_unit: location.type === 'city' ? 'kilometer' : undefined
      };
    });
  }

  /**
   * Formata nome de exibição conforme Meta padrão
   */
  private formatDisplayName(location: any): string {
    const parts = [location.name];
    
    if (location.region && location.region !== location.name) {
      parts.push(location.region);
    }
    
    if (location.country_name && location.country_name !== location.name) {
      parts.push(location.country_name);
    }
    
    return parts.join(', ');
  }
}

export const officialLocationSearchService = new OfficialLocationSearchService();
