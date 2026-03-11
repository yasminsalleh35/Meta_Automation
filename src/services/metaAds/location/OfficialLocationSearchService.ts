
/**
 * Serviço de busca oficial de localização usando Meta API
 * Baseado na documentação: https://developers.facebook.com/docs/marketing-api/targeting-search
 */

export class OfficialLocationSearchService {
  private baseUrl = 'https://graph.facebook.com/v23.0'; // ✅ Atualizado para v23.0

  /**
   * Busca localizações usando o endpoint oficial do Meta
   * @param params Parâmetros de busca estruturados
   */
  async searchLocations(params: {
    query: string;
    accessToken: string;
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
      accessToken, 
      locationTypes = ['city', 'region'],
      countryCode,
      limit = 25 
    } = params;
    console.log(`🔍 Searching official Meta locations for: "${query}"`, {
      locationTypes,
      countryCode,
      limit
    });
    
    if (!accessToken) {
      console.warn('⚠️ No access token provided, returning empty results');
      return [];
    }
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const encodedTypes = encodeURIComponent(JSON.stringify(locationTypes));
      
      // ✅ Remover locale fixo pt_BR e adicionar country_code dinâmico
      let url = `${this.baseUrl}/search?type=adgeolocation&location_types=${encodedTypes}&q=${encodedQuery}&limit=${limit}&access_token=${accessToken}`;
      
      if (countryCode) {
        url += `&country_code=${countryCode}`;
      }
      
      console.log(`🌐 Meta API URL: ${url.replace(accessToken, 'TOKEN_HIDDEN')}`);
      console.log(`🔍 Requesting locationTypes: ${JSON.stringify(locationTypes)}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Meta Location Search Error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // ✅ Tratamento 429 com retry
        if (response.status === 429) {
          console.warn('⚠️ Rate limit hit (429), retrying after 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const retryResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log(`✅ Retry successful: ${retryData.data?.length || 0} locations`);
            return this.processLocationResults(retryData.data || []);
          }
        }
        
        console.warn('⚠️ Returning empty results due to API error');
        return [];
      }

      const data = await response.json();
      console.log(`✅ Meta API returned ${data.data?.length || 0} locations`);
      
      return this.processLocationResults(data.data || []);
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

  /**
   * Valida e busca localização específica por key
   */
  async validateLocationByKey(key: string, accessToken: string): Promise<any | null> {
    try {
      const url = `${this.baseUrl}/${key}?fields=name,type,country_code,region&access_token=${accessToken}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const location = await response.json();
        console.log(`✅ Location validated: ${location.name}`);
        return location;
      } else {
        console.warn(`⚠️ Location key not found: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error validating location key ${key}:`, error);
      return null;
    }
  }
}

export const officialLocationSearchService = new OfficialLocationSearchService();
