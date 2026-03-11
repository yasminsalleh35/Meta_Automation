
import { useToast } from '@/hooks/use-toast';

interface UseMetaAdsSaveActionsProps {
  accessToken: string;
  selectedAccounts: string[];
  selectedPages: string[];
  globalConfig: any;
  saveIntegration: (appId: string, appSecret: string, accessToken: string, selectedAccounts: string[], selectedPages: string[], businessManagerId?: string) => Promise<any>;
  refreshIntegration: () => Promise<any>;
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
}

export const useMetaAdsSaveActions = ({
  accessToken,
  selectedAccounts,
  selectedPages,
  globalConfig,
  saveIntegration,
  refreshIntegration,
  setCurrentStep
}: UseMetaAdsSaveActionsProps) => {
  const { toast } = useToast();

  const handleSaveIntegration = async () => {
    console.log('💾 Starting integration save process...');
    
    // Validações pré-salvamento
    if (!accessToken) {
      console.error('❌ No access token available');
      toast({
        title: "Token não encontrado",
        description: "Reconecte-se primeiro para obter um token válido.",
        variant: "destructive"
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      console.error('❌ No accounts selected');
      toast({
        title: "Nenhuma conta selecionada",
        description: "Selecione pelo menos uma conta de anúncio para continuar.",
        variant: "destructive"
      });
      return;
    }

    if (!globalConfig?.appId || !globalConfig?.appSecret) {
      console.error('❌ Global config missing during save');
      toast({
        title: "Configuração incompleta",
        description: "Configuração global do Meta Ads não encontrada.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('💾 Saving integration with data:', {
        appId: globalConfig.appId,
        hasAppSecret: !!globalConfig.appSecret,
        businessManagerId: globalConfig.businessManagerId,
        selectedAccounts: selectedAccounts.length,
        selectedPages: selectedPages.length,
        hasAccessToken: !!accessToken
      });

      await saveIntegration(
        globalConfig.appId,
        globalConfig.appSecret,
        accessToken,
        selectedAccounts,
        selectedPages,
        globalConfig.businessManagerId
      );
      
      console.log('✅ Integration saved successfully');
      
      // Atualizar estado da integração
      await refreshIntegration();
      
      // Progredir para estado conectado
      setCurrentStep('connected');
      
      toast({
        title: "Integração salva!",
        description: "Meta Ads foi configurado com sucesso.",
      });
      
    } catch (error) {
      console.error('❌ Save integration error:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar a integração",
        variant: "destructive"
      });
    }
  };

  return {
    handleSaveIntegration
  };
};
