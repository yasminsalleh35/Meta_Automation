import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useUserRole } from '@/hooks/useUserRole';
import { AsaasConfigSafe, AsaasEnvironment } from '@/types/asaas';

interface UpdateAsaasConfigParams {
  environment?: AsaasEnvironment;
  api_key?: string;
  webhook_secret?: string;
  is_active?: boolean;
}

export const useAsaasConfig = (environment: AsaasEnvironment) => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { isAdmin } = useUserRole();
  
  const [config, setConfig] = useState<AsaasConfigSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchConfig = async () => {
    const mustChange = typeof window !== "undefined" && localStorage.getItem("must_change_password") === "1";
    if (mustChange) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!isAdmin) {
        setConfig(null);
        return;
      }

      const { data, error } = await supabase
        .from('asaas_config')
        .select('id, environment, is_active, created_at, updated_at, api_key, webhook_secret')
        .eq('environment', environment)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Asaas config:', error);
        
        if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar as configurações do Asaas.",
            variant: "destructive"
          });
        }
        return;
      }

      if (data) {
        // Process data to add flags and remove sensitive fields
        const configWithFlags: AsaasConfigSafe = {
          id: data.id,
          environment: data.environment,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
          has_api_key: !!(data.api_key && data.api_key.trim() !== ''),
          has_webhook_secret: !!(data.webhook_secret && data.webhook_secret.trim() !== ''),
        };
        setConfig(configWithFlags);
      } else {
        setConfig(null);
      }

    } catch (error) {
      console.error('Error fetching Asaas config:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as configurações do Asaas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertConfig = async (updates: UpdateAsaasConfigParams) => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Não autenticado",
          description: "Você precisa estar logado para salvar configurações.",
          variant: "destructive"
        });
        return false;
      }

      if (!isAdmin) {
        toast({
          title: "Acesso negado",
          description: "Apenas administradores podem modificar configurações do Asaas.",
          variant: "destructive"
        });
        return false;
      }

      const targetEnvironment = updates.environment || 'sandbox';

      const { data: existingConfigs } = await supabase
        .from('asaas_config')
        .select('id')
        .eq('environment', targetEnvironment);

      const payload: any = {
        environment: targetEnvironment,
        is_active: updates.is_active !== undefined ? updates.is_active : true
      };

      if (updates.api_key) payload.api_key = updates.api_key;
      if (updates.webhook_secret) payload.webhook_secret = updates.webhook_secret;

      if (existingConfigs && existingConfigs.length > 0) {
        const configId = existingConfigs[0].id;
        const { error: updateError } = await supabase
          .from('asaas_config')
          .update(payload)
          .eq('id', configId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('asaas_config')
          .insert([payload]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: `Configurações do Asaas (${targetEnvironment}) salvas com sucesso.`,
      });

      await fetchConfig();
      return true;

    } catch (error: any) {
      console.error('Error upserting Asaas config:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações do Asaas.",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('asaas-test-connection', {
        body: { environment }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: `Conectado ao Asaas (${data.environment}).`,
        });
        return true;
      } else {
        throw new Error(data?.error?.message || 'Falha ao testar conexão');
      }

    } catch (error: any) {
      console.error('Error testing Asaas connection:', error);
      toast({
        title: "Erro na conexão",
        description: error.message || "Não foi possível conectar ao Asaas.",
        variant: "destructive"
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isAdmin !== null) {
      fetchConfig();
    }
  }, [isAdmin, environment]);

  const isConfigured = config?.has_api_key === true;

  return {
    config,
    loading,
    saving,
    testing,
    upsertConfig,
    testConnection,
    refetch: fetchConfig,
    isConfigured
  };
};
