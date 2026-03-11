
interface InstagramValidationResult {
  isValid: boolean;
  finalId?: string;
  accountInfo?: any;
  error?: string;
}

export class InstagramIdResolutionService {
  /**
   * Resolve and validate Instagram ID with enhanced verification
   */
  static async resolveAndValidateInstagramId(
    instagramId: string,
    pageId: string,
    accessToken: string
  ): Promise<InstagramValidationResult> {
    console.log('🔍 Enhanced Instagram ID resolution starting...', {
      instagramId,
      pageId,
      timestamp: new Date().toISOString()
    });

    if (!instagramId || !pageId || !accessToken) {
      return {
        isValid: false,
        error: 'Missing required parameters for Instagram validation'
      };
    }

    try {
      // Step 1: Direct validation of provided ID
      console.log('📱 Step 1: Direct validation of Instagram ID:', instagramId);
      
      const directValidation = await this.validateInstagramIdDirect(instagramId, accessToken);
      if (directValidation.isValid) {
        console.log('✅ Direct validation successful:', directValidation.accountInfo);
        
        // Additional check: verify this Instagram is connected to the page
        const connectionCheck = await this.verifyInstagramPageConnection(instagramId, pageId, accessToken);
        if (connectionCheck.isValid) {
          return {
            isValid: true,
            finalId: instagramId,
            accountInfo: directValidation.accountInfo
          };
        } else {
          console.warn('⚠️ Instagram account exists but not connected to page');
        }
      }

      // Step 2: Get Instagram accounts connected to the page
      console.log('📱 Step 2: Getting page-connected Instagram accounts...');
      
      const pageInstagramAccounts = await this.getPageConnectedInstagramAccounts(pageId, accessToken);
      console.log('📱 Found page-connected accounts:', pageInstagramAccounts);

      if (pageInstagramAccounts.length === 0) {
        return {
          isValid: false,
          error: 'No Instagram accounts connected to this Facebook page'
        };
      }

      // Step 3: Try to find a match or use the first valid one
      const targetAccount = pageInstagramAccounts.find(acc => acc.id === instagramId) || pageInstagramAccounts[0];
      
      console.log('📱 Selected Instagram account:', targetAccount);

      // Step 4: Final validation of the selected account
      const finalValidation = await this.validateInstagramIdDirect(targetAccount.id, accessToken);
      if (finalValidation.isValid) {
        return {
          isValid: true,
          finalId: targetAccount.id,
          accountInfo: finalValidation.accountInfo
        };
      }

      return {
        isValid: false,
        error: 'No valid Instagram account could be resolved'
      };

    } catch (error) {
      console.error('❌ Instagram ID resolution failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error during Instagram validation'
      };
    }
  }

  /**
   * Validate Instagram ID directly with Meta API
   */
  private static async validateInstagramIdDirect(
    instagramId: string,
    accessToken: string
  ): Promise<InstagramValidationResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${instagramId}?fields=id,name,username&access_token=${accessToken}`
      );

      if (!response.ok) {
        console.log('❌ Direct Instagram validation failed:', response.status);
        return { isValid: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.error) {
        console.log('❌ Instagram API error:', data.error);
        return { isValid: false, error: data.error.message };
      }

      console.log('✅ Instagram account validated:', data);
      return {
        isValid: true,
        finalId: data.id,
        accountInfo: data
      };

    } catch (error) {
      console.error('❌ Direct validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Verify that Instagram account is connected to the Facebook page
   */
  private static async verifyInstagramPageConnection(
    instagramId: string,
    pageId: string,
    accessToken: string
  ): Promise<InstagramValidationResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
      );

      if (!response.ok) {
        return { isValid: false, error: 'Failed to check page connection' };
      }

      const data = await response.json();
      
      if (data.instagram_business_account?.id === instagramId) {
        console.log('✅ Instagram is connected to page');
        return { isValid: true };
      }

      console.log('⚠️ Instagram not directly connected to page');
      return { isValid: false, error: 'Instagram account not connected to page' };

    } catch (error) {
      console.error('❌ Connection verification error:', error);
      return { isValid: false, error: 'Connection check failed' };
    }
  }

  /**
   * Get Instagram accounts connected to a Facebook page
   */
  private static async getPageConnectedInstagramAccounts(
    pageId: string,
    accessToken: string
  ): Promise<Array<{ id: string; name: string; username?: string }>> {
    try {
      // Method 1: Direct page connection
      const pageResponse = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
      );

      const accounts: Array<{ id: string; name: string; username?: string }> = [];

      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        if (pageData.instagram_business_account) {
          console.log('📱 Found page-connected Instagram:', pageData.instagram_business_account);
          
          // Get account details
          const accountResponse = await fetch(
            `https://graph.facebook.com/v19.0/${pageData.instagram_business_account.id}?fields=id,name,username&access_token=${accessToken}`
          );
          
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            accounts.push(accountData);
          }
        }
      }

      // Method 2: Get accounts from user's permissions (fallback)
      if (accounts.length === 0) {
        console.log('📱 Trying alternative method to find Instagram accounts...');
        
        try {
          const accountsResponse = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,name,username}&access_token=${accessToken}`
          );
          
          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json();
            
            accountsData.data?.forEach((page: any) => {
              if (page.instagram_business_account) {
                accounts.push(page.instagram_business_account);
              }
            });
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback method failed:', fallbackError);
        }
      }

      console.log('📱 Final Instagram accounts found:', accounts);
      return accounts;

    } catch (error) {
      console.error('❌ Error getting page Instagram accounts:', error);
      return [];
    }
  }
}
