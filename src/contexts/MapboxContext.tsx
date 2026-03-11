

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapboxContextType {
  mapboxToken: string | null;
  setMapboxToken: (token: string) => void;
  isTokenAvailable: boolean;
  tokenValid: boolean | null;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

export const useMapbox = () => {
  const context = useContext(MapboxContext);
  if (context === undefined) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
};

interface MapboxProviderProps {
  children: React.ReactNode;
}

export const MapboxProvider: React.FC<MapboxProviderProps> = ({ children }) => {
  const [mapboxToken, setMapboxTokenState] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Validar token com request real para API do Mapbox
  const validateTokenWithAPI = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 [MAPBOX-VALIDATE] Testing token validity with real API request...');
      
      const testUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${token}&limit=1`;
      const response = await fetch(testUrl);
      
      const isValid = response.ok && response.status !== 401 && response.status !== 403;
      
      if (isValid) {
        console.log('✅ [MAPBOX-VALIDATE] Token is VALID');
      } else {
        console.error('❌ [MAPBOX-VALIDATE] Token is INVALID', {
          status: response.status,
          statusText: response.statusText
        });
        // Limpar localStorage se token inválido
        localStorage.removeItem('admin_mapbox_token');
      }
      
      setTokenValid(isValid);
      return isValid;
    } catch (error) {
      console.error('❌ [MAPBOX-VALIDATE] Token validation failed:', error);
      setTokenValid(false);
      localStorage.removeItem('admin_mapbox_token');
      return false;
    }
  };

  useEffect(() => {
    const loadMapboxToken = async () => {
      // 1. Tentar carregar do localStorage primeiro (cache)
      const cachedToken = localStorage.getItem('admin_mapbox_token');
      if (cachedToken) {
        console.log('✅ [MAPBOX-LOAD] Token loaded from localStorage (cache)');
        setMapboxTokenState(cachedToken);
        
        // Validar token com API real
        const isValid = await validateTokenWithAPI(cachedToken);
        if (isValid) {
          return; // Token válido, não precisa buscar do Supabase
        }
        
        console.warn('⚠️ [MAPBOX-LOAD] Cached token invalid, fetching from Supabase...');
      }

      // 2. Se não encontrar ou token inválido, buscar do Supabase
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('setting_value')
          .eq('setting_key', 'mapbox_token')
          .single();

        if (error) {
          console.error('❌ [MAPBOX-LOAD] Error loading token from Supabase:', error);
          return;
        }

        if (data?.setting_value?.token) {
          const token = data.setting_value.token;
          console.log('✅ [MAPBOX-LOAD] Token loaded from Supabase');
          setMapboxTokenState(token);
          
          // Validar token do Supabase também
          const isValid = await validateTokenWithAPI(token);
          if (isValid) {
            // Salvar no localStorage apenas se válido
            localStorage.setItem('admin_mapbox_token', token);
          }
        } else {
          console.warn('⚠️ [MAPBOX-LOAD] Token not found in global_settings');
          setTokenValid(false);
        }
      } catch (err) {
        console.error('❌ [MAPBOX-LOAD] Failed to fetch token:', err);
        setTokenValid(false);
      }
    };

    loadMapboxToken();
  }, []);

  const setMapboxToken = async (token: string) => {
    console.log('🔄 [MAPBOX-SET] Validating new token before saving...');
    
    // Validar token antes de salvar
    const isValid = await validateTokenWithAPI(token);
    
    if (!isValid) {
      console.error('❌ [MAPBOX-SET] Token validation failed, not saving');
      throw new Error('Token Mapbox inválido. Verifique se copiou corretamente ou regenere um novo token.');
    }
    
    setMapboxTokenState(token);
    localStorage.setItem('admin_mapbox_token', token);
    
    // Salvar também no Supabase para sincronizar entre dispositivos
    try {
      const { error } = await supabase.rpc('upsert_global_setting', {
        p_setting_key: 'mapbox_token',
        p_setting_value: { token },
        p_description: 'Mapbox API Token for map functionality'
      });
      
      if (error) {
        console.error('❌ [MAPBOX-SET] Error saving token to Supabase:', error);
        throw error;
      } else {
        console.log('✅ [MAPBOX-SET] Token validated and saved to Supabase');
      }
    } catch (err) {
      console.error('❌ [MAPBOX-SET] Failed to save token:', err);
      throw err;
    }
  };

  const isTokenAvailable = mapboxToken !== null && mapboxToken.length > 0 && tokenValid !== false;

  return (
    <MapboxContext.Provider value={{
      mapboxToken,
      setMapboxToken,
      isTokenAvailable,
      tokenValid
    }}>
      {children}
    </MapboxContext.Provider>
  );
};
