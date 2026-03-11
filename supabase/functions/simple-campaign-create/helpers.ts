
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Função para buscar coordenadas via Mapbox (fallback)
async function geocodeCityViaMapbox(cityName: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    console.log(`Iniciando busca de coordenadas via Mapbox para cidade: "${cityName}"`);
    
    // Buscar token do Mapbox nas configurações globais
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: mapboxSetting, error: settingError } = await supabaseClient
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'mapbox_token')
      .single();

    if (settingError || !mapboxSetting?.setting_value?.token) {
      console.warn('Token do Mapbox não encontrado');
      return null;
    }

    const mapboxToken = mapboxSetting.setting_value.token;
    const encodedCity = encodeURIComponent(cityName);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedCity}.json?country=br&types=place&access_token=${mapboxToken}&language=pt-BR&limit=1`;
    
    const response = await fetch(mapboxUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar coordenadas via Mapbox para "${cityName}"`, error);
    return null;
  }
}

// ✅ CORRIGIDO: Função para buscar Instagram User ID válido da página
async function getValidInstagramUserId(pageId: string, accessToken: string): Promise<string | null> {
  try {
    console.log(`🔍 Validando Instagram User ID para página ${pageId}...`);
    
    // Primeira tentativa: instagram_business_account
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      return null;
    }
    
    if (data.instagram_business_account && data.instagram_business_account.id) {
      const instagramUserId = data.instagram_business_account.id;
      
      // Validar se o ID do Instagram é válido
      const validationResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramUserId}?fields=id,name,username&access_token=${accessToken}`
      );
      
      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        if (validationData.id) {
          return instagramUserId;
        }
      }
    }

    // Segunda tentativa: page_backed_instagram_accounts (fallback)
    const fallbackResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=page_backed_instagram_accounts&access_token=${accessToken}`
    );

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.page_backed_instagram_accounts && fallbackData.page_backed_instagram_accounts.data && fallbackData.page_backed_instagram_accounts.data.length > 0) {
        return fallbackData.page_backed_instagram_accounts.data[0].id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro geral ao buscar Instagram User ID', error);
    return null;
  }
}

export { geocodeCityViaMapbox, getValidInstagramUserId };
