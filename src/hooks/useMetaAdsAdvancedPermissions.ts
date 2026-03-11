
import { useToast } from '@/hooks/use-toast';
import { useMetaAdsCredentialValidator } from './useMetaAdsCredentialValidator';
import { useMetaAdsPermissionLevels } from './useMetaAdsPermissionLevels';

export const useMetaAdsAdvancedPermissions = () => {
  const { toast } = useToast();
  const { validateCredentials } = useMetaAdsCredentialValidator();
  const { permissionLevels } = useMetaAdsPermissionLevels();

  const requestAdvancedPermissions = async (appId?: string, appSecret?: string) => {
    try {
      console.log('Requesting required permissions...');
      const result = await validateCredentials(appId, appSecret, 'required');
      
      // Check if we got required permissions - with safety check
      const requiredScopes = permissionLevels.required?.scopes || [];
      const hasRequiredPermissions = requiredScopes.length > 0 && requiredScopes.every(scope => 
        result.grantedScopes.includes(scope)
      );

      if (hasRequiredPermissions) {
        toast({
          title: "Permissões concedidas!",
          description: "Agora você pode criar campanhas e acessar insights avançados.",
        });
      } else {
        toast({
          title: "Permissões parciais",
          description: "Algumas permissões podem precisar de aprovação do Facebook.",
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Erro nas permissões",
        description: "Algumas permissões podem precisar de verificação empresarial.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    requestAdvancedPermissions
  };
};
