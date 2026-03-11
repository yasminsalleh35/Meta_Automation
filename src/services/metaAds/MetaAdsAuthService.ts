
interface MetaAuthTokens {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface MetaAuthError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

export class MetaAdsAuthService {
  private baseUrl = 'https://graph.facebook.com/v23.0';
  
  // OAuth URL generation with scopes from permissionLevels
  generateOAuthUrl(clientId: string, redirectUri: string, scopes: string[] = []): string {
    // Base scopes including WhatsApp Business management and messaging
    const BASE_SCOPES = [
      'pages_show_list',
      'pages_read_engagement', 
      'ads_management',
      'instagram_basic',
      'public_profile',
      'business_management',
      'instagram_manage_insights',
      'ads_read',
      'read_insights',
      'whatsapp_business_management', // ✅ obrigatório para ler WABA/telefones
      'whatsapp_business_messaging'   // ⚙️ opcional, manter para futuro
    ];

    // Use provided scopes or base scopes
    const requestedScopes = scopes.length > 0 ? scopes : BASE_SCOPES;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: requestedScopes.join(','),
      response_type: 'code',
      state: 'meta_ads_oauth'
    });
    
    return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  }

  // Exchange code for access token server-side
  async exchangeCodeServerSide(
    code: string,
    redirectUri: string,
    state?: string
  ): Promise<void> {
    console.log('Exchanging code for token server-side...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/meta-oauth-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getUserJwt()}`
        },
        body: JSON.stringify({ code, redirect_uri: redirectUri, state })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server-side token exchange failed:', errorData);
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      console.log('Server-side token exchange successful');
    } catch (error) {
      console.error('Network error during server-side token exchange:', error);
      throw new Error('Erro de rede ao trocar código por token. Verifique sua conexão.');
    }
  }

  private async getUserJwt(): Promise<string> {
    // Usar instância singleton do Supabase
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authenticated user session');
    }
    
    return session.access_token;
  }

  // Validate access token and get user info
  async validateToken(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name,email&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Token validation failed');
      }

      return response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  }

  // Get granted permissions
  async getGrantedPermissions(accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/permissions?access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get permissions');
      }

      const data = await response.json();
      return data.data
        ?.filter((perm: any) => perm.status === 'granted')
        ?.map((perm: any) => perm.permission) || [];
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  // NOVO: Método para processar ativos após OAuth com dados reais
  async processMetaAssetsAfterOAuth(accessToken: string, userId: string): Promise<any> {
    try {
      console.log('Processing Meta assets after OAuth for user:', userId);
      
      // Fetch Facebook pages
      const pagesResponse = await fetch(
        `${this.baseUrl}/me/accounts?access_token=${accessToken}`
      );
      
      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json();
        throw new Error(`Meta API error: ${errorData.error?.message || 'Failed to fetch Facebook pages'}`);
      }
      
      const pagesData = await pagesResponse.json();
      console.log('Found Facebook pages:', pagesData.data?.length || 0);
      
      // Process each page to get Instagram connection
      const processedPages = await Promise.all(
        (pagesData.data || []).map(async (page: any) => {
          try {
            const instagramResponse = await fetch(
              `${this.baseUrl}/${page.id}?fields=instagram_business_account{id,name,username}&access_token=${accessToken}`
            );
            
            let instagramData = { instagram_business_account: null };
            if (instagramResponse.ok) {
              instagramData = await instagramResponse.json();
            }
            
            return {
              id: page.id,
              name: page.name,
              access_token: page.access_token,
              instagram_id: instagramData.instagram_business_account?.id || null,
              instagram_name: instagramData.instagram_business_account?.name || instagramData.instagram_business_account?.username || null
            };
          } catch (error) {
            console.error(`Error processing page ${page.id}:`, error);
            return {
              id: page.id,
              name: page.name,
              access_token: page.access_token,
              instagram_id: null,
              instagram_name: null
            };
          }
        })
      );
      
      return {
        pages: processedPages,
        totalPages: processedPages.length,
        instagramConnected: processedPages.filter(p => p.instagram_id).length
      };
    } catch (error) {
      console.error('Error processing Meta assets:', error);
      throw error;
    }
  }
}

export const metaAdsAuthService = new MetaAdsAuthService();
