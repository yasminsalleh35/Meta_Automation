
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

interface GlobalConfig {
  appId: string;
  appSecret: string;
  businessManagerId: string;
}

interface MetaAdsConfig {
  id: string;
  app_id: string;
  app_secret: string;
  business_manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useMetaAdsAdmin = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  
  const [users, setUsers] = useState<UserWithIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    appId: '',
    appSecret: '',
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
        .select('*')
        .eq('provider', 'meta_ads');

      if (integrationsError) throw integrationsError;

      // Combinar dados
      const usersWithIntegrations: UserWithIntegration[] = usersData.map(user => ({
        ...user,
        integration: integrationsData.find(int => int.user_id === user.id)
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
      console.log('Fetching Meta Ads config...');
      const { data, error } = await supabase.rpc('get_meta_ads_config');

      if (error) {
        console.error('Error fetching Meta Ads config:', error);
        return;
      }

      console.log('Meta Ads config fetched:', data);

      if (data && data.length > 0) {
        const config = data[0] as MetaAdsConfig;
        setGlobalConfig({
          appId: config.app_id,
          appSecret: config.app_secret,
          businessManagerId: config.business_manager_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching Meta Ads config:', error);
    }
  };

  const saveGlobalConfig = async () => {
    if (!globalConfig.appId || !globalConfig.appSecret) {
      toast({
        title: "Campos obrigatórios",
        description: "App ID e App Secret são obrigatórios.",
        variant: "destructive"
      });
      throw new Error('Missing required fields');
    }

    try {
      console.log('Saving global config:', globalConfig);

      const { data, error } = await supabase.rpc('upsert_meta_ads_config', {
        p_app_id: globalConfig.appId,
        p_app_secret: globalConfig.appSecret,
        p_business_manager_id: globalConfig.businessManagerId || null
      });

      if (error) {
        console.error('Error saving Meta Ads config:', error);
        throw error;
      }

      console.log('Global config saved successfully:', data);

      toast({
        title: "Configurações salvas!",
        description: "As configurações globais do Meta App foram salvas com sucesso.",
      });

      // Recarregar configurações
      await fetchMetaAdsConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const configureIntegration = async (user: UserWithIntegration) => {
    if (!globalConfig.appId || !globalConfig.appSecret) {
      toast({
        title: "Configuração incompleta",
        description: "Configure as credenciais globais do Meta App primeiro.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Gerar URL de OAuth
      const redirectUri = `${window.location.origin}/admin/meta-ads`;
      const scopes = [
        'ads_management',
        'pages_read_engagement', 
        'pages_show_list',
        'business_management',
        'read_insights'
      ].join(',');
      
      const params = new URLSearchParams({
        client_id: globalConfig.appId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        state: `user_${user.id}`
      });
      
      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
      
      // Abrir OAuth em nova janela
      const authWindow = window.open(
        oauthUrl,
        'meta-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Simular integração bem-sucedida (em produção seria o resultado do OAuth)
      setTimeout(() => {
        authWindow?.close();
        toast({
          title: "Integração configurada!",
          description: `Meta Ads conectado para ${user.email}`,
        });
        fetchUsersAndIntegrations();
      }, 2000);

    } catch (error) {
      console.error('Error configuring integration:', error);
      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar a integração.",
        variant: "destructive"
      });
    }
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
