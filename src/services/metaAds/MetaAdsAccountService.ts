export class MetaAdsAccountService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  // Get user's ad accounts
  async getAdAccounts(accessToken: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/me/adaccounts?fields=id,name,account_status,currency,timezone_name,account_id&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch ad accounts');
    }

    const data = await response.json();
    return data.data || [];
  }

  // UPDATED: Get user's pages with pagination and access_token
  async getPages(accessToken: string): Promise<any[]> {
    console.log('📄 [PAGES] Starting page fetch with pagination...');
    const allPages: any[] = [];
    let nextUrl = `${this.baseUrl}/me/accounts?fields=id,name,category,fan_count,access_token&access_token=${accessToken}`;
    
    // ✅ LIMITE: Máximo de 100 páginas para evitar rate limiting
    const MAX_PAGES = 100;
    const PAGINATION_DELAY = 500; // 500ms entre requisições (aumentado de 100ms)
    let pageCount = 0;

    try {
      while (nextUrl && pageCount < MAX_PAGES) {
        console.log('📄 [PAGES] Fetching:', nextUrl.replace(accessToken, 'TOKEN_HIDDEN'));
        
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch pages');
        }

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          allPages.push(...data.data);
          pageCount++;
          console.log(`📄 [PAGES] Fetched ${data.data.length} pages, total: ${allPages.length} (batch ${pageCount}/${MAX_PAGES})`);
        }

        // Check for pagination
        nextUrl = data.paging?.next || null;
        
        if (nextUrl && pageCount < MAX_PAGES) {
          console.log('📄 [PAGES] More pages available, continuing pagination...');
          // ✅ DELAY: Increased to 500ms to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY));
        } else if (pageCount >= MAX_PAGES) {
          console.log(`⚠️ [PAGES] Reached max pages limit (${MAX_PAGES}), stopping pagination`);
          nextUrl = null;
        }
      }

      console.log(`📄 [PAGES] Completed pagination, total pages: ${allPages.length}`);
      return allPages;
      
    } catch (error) {
      console.error('❌ [PAGES] Error in paginated fetch:', error);
      throw error;
    }
  }

  // UPDATED: Get Instagram Business Account using page access token
  async getConnectedInstagramAccounts(pageId: string, pageAccessToken: string): Promise<any[]> {
    console.log('🔍 [INSTAGRAM] Fetching Instagram Business Account for page:', pageId);
    
    try {
      // Use the exact endpoint from Meta documentation
      const url = `${this.baseUrl}/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`;
      console.log('🔗 [INSTAGRAM] URL:', url.replace(pageAccessToken, 'TOKEN_HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [INSTAGRAM] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Check for specific permission errors
        if (errorData.error?.code === 10) {
          console.warn('⚠️ [INSTAGRAM] Permission error - page access token may be invalid');
        }
        
        return []; // Return empty array instead of throwing
      }

      const data = await response.json();
      console.log('✅ [INSTAGRAM] API Response:', data);
      
      // Check if Instagram Business Account exists
      if (data.instagram_business_account) {
        const account = data.instagram_business_account;
        const result = [{
          id: account.id,
          name: account.name || account.username,
          username: account.username,
          profile_pic: account.profile_picture_url
        }];
        
        console.log('✅ [INSTAGRAM] Found Instagram Business Account:', result);
        return result;
      } else {
        console.log('ℹ️ [INSTAGRAM] No Instagram Business Account connected to this page');
        return [];
      }
      
    } catch (error) {
      console.error('❌ [INSTAGRAM] Error fetching Instagram Business Account:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get Instagram accounts from ad account (legacy method, keeping for fallback)
  async getInstagramAccounts(adAccountId: string, accessToken: string): Promise<any[]> {
    console.log('🔍 [LEGACY] Attempting legacy Instagram fetch from ad account:', adAccountId);
    
    try {
      const directUrl = `${this.baseUrl}/${adAccountId}/instagram_accounts?fields=id,name,username,profile_pic&access_token=${accessToken}`;
      const response = await fetch(directUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [LEGACY] Legacy method successful:', data.data || []);
        return data.data || [];
      } else {
        console.warn('⚠️ [LEGACY] Legacy method failed, this is expected');
        return [];
      }
    } catch (error) {
      console.warn('⚠️ [LEGACY] Legacy method error:', error);
      return [];
    }
  }

  // Get WhatsApp Business Accounts
  async getWhatsAppBusinessAccounts(accessToken: string): Promise<any[]> {
    try {
      console.log('🔍 Fetching WhatsApp Business accounts...');
      
      const response = await fetch(
        `${this.baseUrl}/me/whatsapp_business_accounts?fields=id,name,phone_number,display_phone_number,status&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('WhatsApp Business API error:', errorData);
        
        if (errorData.error?.code === 10 || errorData.error?.type === 'OAuthException') {
          console.log('ℹ️ WhatsApp Business permission not available - this is normal for many apps');
        }
        
        return [];
      }

      const data = await response.json();
      console.log('✅ WhatsApp Business accounts:', data.data || []);
      return data.data || [];
    } catch (error) {
      console.warn('Error fetching WhatsApp Business accounts:', error);
      return [];
    }
  }

  // ENHANCED: Validate token and check permissions with detailed diagnostics
  async validateTokenAndPermissions(accessToken: string): Promise<any> {
    console.log('🔍 [VALIDATION] Validating token and permissions...');
    
    try {
      // Check token validity and get permissions
      const debugUrl = `${this.baseUrl}/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
      const response = await fetch(debugUrl);
      
      if (!response.ok) {
        throw new Error('Token validation failed');
      }
      
      const debugData = await response.json();
      const tokenInfo = debugData.data;
      
      // Define required permissions with detailed info
      const permissionRequirements = {
        essential: {
          name: 'Permissões Essenciais',
          scopes: ['ads_management'],
          description: 'Necessárias para gerenciar campanhas publicitárias'
        },
        pages: {
          name: 'Permissões de Páginas',
          scopes: ['pages_read_engagement', 'pages_read_user_content', 'pages_show_list'],
          description: 'Necessárias para acessar suas páginas do Facebook'
        },
        instagram: {
          name: 'Permissões do Instagram',
          scopes: ['instagram_basic', 'instagram_content_publish'],
          description: 'Necessárias para conectar contas do Instagram Business'
        },
        whatsapp: {
          name: 'Permissões do WhatsApp',
          scopes: ['whatsapp_business_management'],
          description: 'Necessárias para acessar WhatsApp Business'
        }
      };
      
      const grantedPermissions = tokenInfo.scopes || [];
      
      // Analyze each permission category
      const permissionAnalysis: any = {};
      const missingCategories: string[] = [];
      const availableCategories: string[] = [];
      
      Object.entries(permissionRequirements).forEach(([category, info]) => {
        const granted = info.scopes.filter(scope => grantedPermissions.includes(scope));
        const missing = info.scopes.filter(scope => !grantedPermissions.includes(scope));
        const hasAll = missing.length === 0;
        const hasAny = granted.length > 0;
        
        permissionAnalysis[category] = {
          name: info.name,
          description: info.description,
          required: info.scopes,
          granted,
          missing,
          hasAll,
          hasAny,
          coverage: Math.round((granted.length / info.scopes.length) * 100)
        };
        
        if (hasAll) {
          availableCategories.push(category);
        } else {
          missingCategories.push(category);
        }
      });
      
      // Determine overall status
      const hasEssentialPermissions = permissionAnalysis.essential.hasAll;
      const canAccessPages = permissionAnalysis.pages.hasAny;
      const canAccessInstagram = permissionAnalysis.instagram.hasAny;
      const canAccessWhatsApp = permissionAnalysis.whatsapp.hasAny;
      
      // Generate user-friendly messages
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (!hasEssentialPermissions) {
        issues.push('Permissões essenciais ausentes - não é possível gerenciar campanhas');
        recommendations.push('Reconecte a integração Meta com permissões completas');
      }
      
      if (!canAccessPages) {
        issues.push('Sem acesso às páginas do Facebook');
        recommendations.push('Conceda permissões de páginas para visualizar suas páginas');
      }
      
      if (!canAccessInstagram) {
        issues.push('Sem acesso ao Instagram Business');
        recommendations.push('Conceda permissões do Instagram para conectar perfis');
      }
      
      if (!canAccessWhatsApp) {
        issues.push('Sem acesso ao WhatsApp Business');
        recommendations.push('Adicione números do WhatsApp manualmente ou conceda permissões');
      }
      
      const result = {
        isValid: tokenInfo.is_valid,
        appId: tokenInfo.app_id,
        grantedPermissions,
        permissionAnalysis,
        hasEssentialPermissions,
        canAccessPages,
        canAccessInstagram,
        canAccessWhatsApp,
        availableCategories,
        missingCategories,
        issues,
        recommendations,
        needsReauthorization: !hasEssentialPermissions || !canAccessPages,
        // Legacy fields for compatibility
        missingRequired: missingCategories,
        missingOptional: [],
        hasRequiredPermissions: hasEssentialPermissions && canAccessPages,
        hasInstagramPermissions: canAccessInstagram
      };
      
      console.log('✅ [VALIDATION] Enhanced permission analysis:', {
        hasEssentialPermissions,
        canAccessPages,
        canAccessInstagram,
        canAccessWhatsApp,
        availableCategories,
        missingCategories,
        issuesCount: issues.length
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ [VALIDATION] Token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        grantedPermissions: [],
        permissionAnalysis: {},
        hasEssentialPermissions: false,
        canAccessPages: false,
        canAccessInstagram: false,
        canAccessWhatsApp: false,
        availableCategories: [],
        missingCategories: ['essential', 'pages', 'instagram', 'whatsapp'],
        issues: ['Erro ao validar token de acesso'],
        recommendations: ['Verifique sua conexão e tente reconectar a integração Meta'],
        needsReauthorization: true,
        // Legacy fields
        missingRequired: [],
        missingOptional: [],
        hasRequiredPermissions: false,
        hasInstagramPermissions: false
      };
    }
  }

  // Keep existing diagnostic methods for backward compatibility
  async diagnoseTokenPermissions(accessToken: string): Promise<any> {
    return this.validateTokenAndPermissions(accessToken);
  }

  async testInstagramConnectivity(accessToken: string): Promise<any[]> {
    console.log('🔍 [TESTE] Testing Instagram API connectivity...');
    
    const testEndpoints = [
      {
        name: 'Me Instagram Accounts',
        url: `${this.baseUrl}/me/instagram_accounts?access_token=${accessToken}`
      },
      {
        name: 'Me Accounts with Instagram',
        url: `${this.baseUrl}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
      },
      {
        name: 'Me Businesses',
        url: `${this.baseUrl}/me/businesses?fields=instagram_accounts&access_token=${accessToken}`
      }
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 [TESTE] Testing: ${endpoint.name}`);
        const response = await fetch(endpoint.url);
        
        const result: {
          name: string;
          status: number;
          statusText: string;
          success: boolean;
          data?: any;
          error?: any;
        } = {
          name: endpoint.name,
          status: response.status,
          statusText: response.statusText,
          success: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          result.data = data;
          console.log(`✅ [TESTE] ${endpoint.name} - SUCCESS:`, data);
        } else {
          const errorData = await response.json();
          result.error = errorData;
          console.error(`❌ [TESTE] ${endpoint.name} - FAILED:`, errorData);
        }

        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ [TESTE] ${endpoint.name} - ERROR:`, error);
        results.push({
          name: endpoint.name,
          success: false,
          status: 0,
          statusText: 'Network Error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log('📊 [TESTE] Instagram connectivity test results:', results);
    return results;
  }

  async runDiagnostics(accessToken: string): Promise<any> {
    console.log('🔍 [DIAGNÓSTICO] Starting comprehensive Instagram diagnostics...');
    
    try {
      const results = {
        tokenDiagnosis: null as any,
        connectivityTest: [] as any[],
        integration: {
          hasToken: !!accessToken,
          tokenLength: accessToken?.length || 0
        }
      };

      try {
        console.log('🔍 [DIAGNÓSTICO] Running token diagnosis...');
        results.tokenDiagnosis = await this.diagnoseTokenPermissions(accessToken);
      } catch (error) {
        console.warn('⚠️ [DIAGNÓSTICO] Token diagnosis failed:', error);
        results.tokenDiagnosis = null;
      }

      try {
        console.log('🔍 [DIAGNÓSTICO] Running Instagram connectivity tests...');
        results.connectivityTest = await this.testInstagramConnectivity(accessToken);
      } catch (error) {
        console.warn('⚠️ [DIAGNÓSTICO] Instagram connectivity test failed:', error);
        results.connectivityTest = [];
      }

      console.log('📊 [DIAGNÓSTICO] Complete diagnosis results:', results);
      return results;

    } catch (error) {
      console.error('❌ [DIAGNÓSTICO] Error in comprehensive diagnostics:', error);
      return {
        tokenDiagnosis: null,
        connectivityTest: [],
        integration: {
          hasToken: !!accessToken,
          tokenLength: accessToken?.length || 0
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const metaAdsAccountService = new MetaAdsAccountService();
