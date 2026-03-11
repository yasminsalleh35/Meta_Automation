
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsPermissionLevels } from './useMetaAdsPermissionLevels';

interface UseMetaAdsIntegrationPermissionsProps {
  globalConfig: any;
  validateCredentials: (appId?: string, appSecret?: string, permissionLevel?: 'required') => Promise<any>;
  fetchAccountsAndPages: (accessToken: string) => Promise<any>;
  currentStep: 'connect' | 'permissions' | 'accounts' | 'connected';
  setAccessToken: (token: string) => void;
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
}

export const useMetaAdsIntegrationPermissions = ({
  globalConfig,
  validateCredentials,
  fetchAccountsAndPages,
  currentStep,
  setAccessToken,
  setCurrentStep
}: UseMetaAdsIntegrationPermissionsProps) => {
  const { toast } = useToast();
  const { permissionLevels: staticPermissionLevels } = useMetaAdsPermissionLevels();
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  
  // Initialize with static permission levels to prevent undefined errors
  const [permissionLevels, setPermissionLevels] = useState(staticPermissionLevels);

  const requestAdvancedPermissions = async () => {
    try {
      console.log('🔧 Requesting advanced permissions...');
      
      // Validar se temos configuração global
      if (!globalConfig?.appId || !globalConfig?.appSecret) {
        console.error('❌ Global config missing for advanced permissions');
        toast({
          title: "Configuração incompleta",
          description: "Configuração global do Meta Ads não encontrada.",
          variant: "destructive"
        });
        throw new Error('Global config missing');
      }

      // Solicitar permissões via OAuth
      const result = await validateCredentials(
        globalConfig.appId,
        globalConfig.appSecret,
        'required'
      );
      
      console.log('✅ Required permissions granted, new token received');
      
      // Atualizar token de acesso
      setAccessToken(result.accessToken);
      
      // Atualizar permissões concedidas usando grantedScopes
      if (result.grantedScopes) {
        setCurrentPermissions(result.grantedScopes);
        
        // Determinar níveis de permissão baseado nas permissões concedidas
        const requiredScopes = staticPermissionLevels?.required?.scopes || [];
        
        const hasRequiredPerms = requiredScopes.length > 0 && requiredScopes.some((perm: string) => 
          result.grantedScopes.includes(perm)
        );
        
        // Use the updated permission levels structure
        setPermissionLevels(staticPermissionLevels);
        
        console.log('📋 Permission levels updated:', {
          required: hasRequiredPerms,
          totalPermissions: result.grantedScopes.length
        });
      }
      
      // Buscar contas e páginas com as novas permissões
      console.log('📊 Fetching accounts and pages with advanced permissions...');
      const assetsResult = await fetchAccountsAndPages(result.accessToken);
      
      if (assetsResult?.accounts?.length > 0 || assetsResult?.pages?.length > 0) {
        console.log('✅ Assets refreshed with advanced permissions:', {
          accounts: assetsResult.accounts?.length || 0,
          pages: assetsResult.pages?.length || 0
        });
        
        toast({
          title: "Permissões concedidas!",
          description: `Agora você pode acessar ${assetsResult.accounts?.length || 0} contas de anúncios e ${assetsResult.pages?.length || 0} páginas.`,
        });
        
        // Se estivermos no passo de permissões, progredir para accounts
        if (currentStep === 'permissions') {
          setCurrentStep('accounts');
        }
      } else {
        console.warn('⚠️ No additional assets found with permissions');
        toast({
          title: "Permissões concedidas",
          description: "Permissões foram concedidas, mas nenhum novo recurso foi encontrado.",
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error requesting advanced permissions:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro nas permissões",
        description: `Não foi possível obter permissões: ${errorMessage}`,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  return {
    currentPermissions,
    setCurrentPermissions,
    permissionLevels: staticPermissionLevels, // Always return static levels to prevent undefined
    setPermissionLevels,
    requestAdvancedPermissions
  };
};
