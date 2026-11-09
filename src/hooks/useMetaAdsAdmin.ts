
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { buildIlikeOrFilter, pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';
import { INTEGRATION_SAFE_COLUMNS } from '@/lib/integrationColumns';

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

  // Audit ADM-03: usuários paginados no servidor (50/página, busca por nome/email) e só as
  // integrações dos usuários da página — antes carregava todos (corte de 1.000 linhas).
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const usersSearchRef = useRef('');
  const usersPageRef = useRef(0);
  const usersRequestRef = useRef(0);

  const fetchUsersAndIntegrations = async (search?: string, nextPage: number = usersPageRef.current) => {
    if (search !== undefined) usersSearchRef.current = search;
    const requestId = ++usersRequestRef.current;
    setUsersLoading(true);
    try {
      const [from, to] = pageRange(nextPage, ADMIN_PAGE_SIZE);
      let usersQuery = supabase
        .rpc('get_profiles_admin_with_email', {} as never, { count: 'exact' }) // função sem argumentos (Args: never)
        .order('created_at', { ascending: false });
      const searchFilter = buildIlikeOrFilter(['name', 'email'], usersSearchRef.current);
      if (searchFilter) usersQuery = usersQuery.or(searchFilter);
      const { data: usersData, error: usersError, count } = await usersQuery.range(from, to);

      if (usersError) throw usersError;
      const ids = (usersData || []).map(user => user.id);

      // Buscar todas as integrações Meta Ads
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('integrations')
        .select(INTEGRATION_SAFE_COLUMNS) // nunca access_token (audit SEC-12)
        .eq('provider', 'meta_ads')
        .in('user_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);

      if (integrationsError) throw integrationsError;
      if (requestId !== usersRequestRef.current) return;

      // Combinar dados
      const usersWithIntegrations: UserWithIntegration[] = (usersData || []).map(user => ({
        ...user,
        integration: ((integrationsData || []) as Integration[]).find(int => int.user_id === user.id)
      }));

      setUsers(usersWithIntegrations);
      setUsersTotal(count ?? 0);
      setUsersPage(nextPage);
      usersPageRef.current = nextPage;
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar usuários e integrações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      if (requestId === usersRequestRef.current) setUsersLoading(false);
    }
  };

  const fetchMetaAdsConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_meta_ads_config');

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
      const { error } = await supabase.rpc('admin_upsert_meta_ads_config', {
        p_app_id: globalConfig.appId,
        p_app_secret: globalConfig.appSecret || undefined, // omitido (default null) = manter o atual
        p_business_manager_id: globalConfig.businessManagerId || undefined
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
      // ADM-05: RLS só deixa o dono apagar — o delete direto removia 0 linhas e mostrava sucesso
      const { error } = await supabase.rpc('admin_disconnect_integration', {
        p_integration_id: user.integration.id,
      });

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
        description: (error as { message?: string })?.message === 'forbidden'
          ? "Você não tem permissão para esta ação."
          : (error as { message?: string })?.message || "Não foi possível remover a integração.",
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
    usersTotal,
    usersPage,
    usersPageSize: ADMIN_PAGE_SIZE,
    usersLoading,
    loading,
    globalConfig,
    setGlobalConfig,
    saveGlobalConfig,
    configureIntegration,
    disconnectIntegration,
    fetchUsersAndIntegrations
  };
};
