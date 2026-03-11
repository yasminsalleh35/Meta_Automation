
import { useToast } from '@/hooks/use-toast';

interface UseMetaAdsPermissionActionsProps {
  requestAdvancedPermissions: () => Promise<any>;
  fetchAccountsAndPages: () => Promise<any>;
  setAccessToken: (token: string) => void;
}

export const useMetaAdsPermissionActions = ({
  requestAdvancedPermissions,
  fetchAccountsAndPages,
  setAccessToken
}: UseMetaAdsPermissionActionsProps) => {
  const { toast } = useToast();

  const handleRequestAdvanced = async () => {
    try {
      console.log('🔧 Requesting advanced permissions...');
      const result = await requestAdvancedPermissions();
      setAccessToken(result.accessToken);
      
      // Reload assets without token parameter
      await fetchAccountsAndPages();
      
      toast({
        title: "Permissões avançadas concedidas!",
        description: "Agora você pode acessar mais recursos do Meta Ads.",
      });
    } catch (error) {
      console.error('❌ Advanced permissions error:', error);
      toast({
        title: "Erro nas permissões avançadas",
        description: error instanceof Error ? error.message : "Erro ao solicitar permissões avançadas",
        variant: "destructive"
      });
    }
  };

  return {
    handleRequestAdvanced
  };
};
