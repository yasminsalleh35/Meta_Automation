
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface Integration {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  created_at: string;
  app_id?: string;
  ad_account_id?: string;
  page_id?: string;
}

interface UserWithIntegration extends User {
  integration?: Integration;
}

// appSecret é somente escrita: vazio = manter o segredo salvo (audit SEC-04)
interface GlobalConfig {
  appId: string;
  appSecret: string;
  appSecretSet: boolean;
  businessManagerId: string;
}

interface MetaAdsAdminConfigRow {
  id: string;
  app_id: string;
  app_secret_set: boolean;
  business_manager_id: string | null;
  created_at: string;
  updated_at: string;
}

// Colunas não sensíveis — nunca access_token (audit SEC-12)
const INTEGRATION_PUBLIC_COLUMNS = 'id, user_id, provider, status, created_at, app_id, ad_account_id, page_id';

export const useMetaAdsAdmin = () => {
  const { toast } = useToast();
  const supabase = useSupabase();

  const [users, setUsers] = useState<UserWithIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    appId: '',
    appSecret: '',
    appSecretSet: false,
    businessManagerId: ''
  });

  const fetchUsersAndIntegrations = async () => {
    try {
      // Buscar todos os usuários usando função administrativa segura
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_profiles_admin_with_email');

      if (usersError) throw usersError;

      // Buscar todas as integrações Meta Ads
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('integrations')
        .select(INTEGRATION_PUBLIC_COLUMNS)
        .eq('provider', 'meta_ads');

      if (integrationsError) throw integrationsError;

      // Combinar dados
      const usersWithIntegrations: UserWithIntegration[] = usersData.map(user => ({
        ...user,
        integration: (integrationsData as Integration[]).find(int => int.user_id === user.id)
      }));

      setUsers(usersWithIntegrations);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar usuários e integrações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaAdsConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_meta_ads_config' as any);

      if (error) {
        console.error('Error fetching Meta Ads config:', error.message);
        return;
      }

      const rows = (data as MetaAdsAdminConfigRow[] | null) ?? [];
      if (rows.length > 0) {
        const config = rows[0];
        setGlobalConfig({
          appId: config.app_id,
          appSecret: '',
          appSecretSet: config.app_secret_set,
          businessManagerId: config.business_manager_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching Meta Ads config:', error);
    }
  };

  const saveGlobalConfig = async () => {
    if (!globalConfig.appId || (!globalConfig.appSecret && !globalConfig.appSecretSet)) {
      toast({
        title: "Campos obrigatórios",
        description: "App ID e App Secret são obrigatórios.",
        variant: "destructive"
      });
      throw new Error('Missing required fields');
    }

    try {
      const { error } = await supabase.rpc('admin_upsert_meta_ads_config' as any, {
        p_app_id: globalConfig.appId,
        p_app_secret: globalConfig.appSecret || null, // null = manter o atual
        p_business_manager_id: globalConfig.businessManagerId || null
      });

      if (error) {
        console.error('Error saving Meta Ads config:', error.message);
        throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "As configurações globais do Meta App foram salvas com sucesso.",
      });

      // Recarregar configurações
      await fetchMetaAdsConfig();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Cada usuário conecta a própria conta Meta (OAuth com o próprio login).
  // O admin não pode concluir o OAuth em nome de outro usuário.
  const configureIntegration = async (user: UserWithIntegration) => {
    toast({
      title: "Conexão feita pelo próprio usuário",
      description: `Peça para ${user.email} conectar a conta Meta em Integrações no painel dele.`,
    });
  };

  const disconnectIntegration = async (user: UserWithIntegration) => {
    if (!user.integration) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', user.integration.id);

      if (error) throw error;

      toast({
        title: "Integração removida",
        description: `Meta Ads desconectado para ${user.email}`,
      });

      fetchUsersAndIntegrations();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível remover a integração.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchUsersAndIntegrations(),
        fetchMetaAdsConfig()
      ]);
    };

    initializeData();
  }, []);

  return {
    users,
    loading,
    globalConfig,
    setGlobalConfig,
    saveGlobalConfig,
    configureIntegration,
    disconnectIntegration,
    fetchUsersAndIntegrations
  };
};
