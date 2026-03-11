// =============================================
// Hook para gerenciar configuração Pagar.me
// Mantém consistência com useStripeConfig
// =============================================

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useUserRole } from '@/hooks/useUserRole';
import { PagarmeConfig, PagarmeConfigSafe, PaymentEnvironment } from '@/types/payments';

interface UpdatePagarmeConfigParams {
  environment?: PaymentEnvironment;
  public_key?: string;
  secret_key?: string;
  encryption_key?: string;
  webhook_secret?: string;
  account_id?: string;
  stripe_custom_payment_method_id?: string;
  plan_id_mensal?: string;
  plan_id_anual?: string;
  installments_max?: number;
  free_installments?: number;
  interest_rate?: number;
  statement_descriptor?: string;
}

export const usePagarmeConfig = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { isAdmin } = useUserRole();
  
  const [config, setConfig] = useState<PagarmeConfigSafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchConfig = async () => {
    // 🚫 Don't fetch while in password recovery flow
    const mustChange = typeof window !== "undefined" && localStorage.getItem("must_change_password") === "1";
    if (mustChange) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // TEMPORARY FIX: Use public function for all users to avoid auth.uid() issues
      // TODO: Fix get_pagarme_config_safe() to work properly with authenticated admins
      const rpcFunction = 'get_pagarme_config_public';
      const { data, error } = await supabase.rpc(rpcFunction);

      if (error) {
        console.error('Error fetching Pagar.me config:', error);
        
        // For regular users (including non-authenticated), silently handle missing config
        if (!isAdmin && (error.message?.includes('row-level security') || error.code === 'PGRST301')) {
          setConfig(null);
          return;
        }
        
        // For admins, show access denied message
        if (isAdmin && (error.message?.includes('row-level security') || error.code === 'PGRST301')) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar as configurações do Pagar.me.",
            variant: "destructive"
          });
        }
        return;
      }

      if (data && data.length > 0) {
        setConfig(data[0] as PagarmeConfigSafe);
      } else {
        // Sem config existente, isso é normal
        setConfig(null);
      }

    } catch (error) {
      console.error('Error fetching Pagar.me config:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as configurações do Pagar.me.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertConfig = async (updates: UpdatePagarmeConfigParams) => {
    setSaving(true);
    
    try {
      console.log('[usePagarmeConfig] Starting upsert with updates:', updates);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[usePagarmeConfig] Current user:', user?.id);
      
      if (!user) {
        console.error('[usePagarmeConfig] No authenticated user');
        toast({
          title: "Não autenticado",
          description: "Você precisa estar logado para salvar configurações.",
          variant: "destructive"
        });
        return false;
      }

      // Buscar config do ambiente ATUAL antes de atualizar
      const targetEnvironment = updates.environment || config?.environment || 'test';
      console.log('[usePagarmeConfig] Target environment:', targetEnvironment);
      
      const { data: existingConfigs } = await supabase
        .from('pagarme_config')
        .select('id')
        .eq('environment', targetEnvironment)
        .maybeSingle();

      let configId = existingConfigs?.id;
      console.log('[usePagarmeConfig] Found config ID for environment:', { configId, targetEnvironment });

      if (configId) {
        // Update existente no ambiente correto
        console.log('[usePagarmeConfig] Updating existing config for environment:', targetEnvironment);
        const { error } = await supabase
          .from('pagarme_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', configId);

        if (error) {
          console.error('[usePagarmeConfig] Error updating Pagar.me config:', error);
          throw error;
        }
      } else {
        // Insert novo - garantir que environment seja sempre incluído
        const insertData = {
          ...updates,
          environment: updates.environment || 'test', // Default para test se não especificado
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('[usePagarmeConfig] Inserting new config with data:', insertData);
        
        const { data, error } = await supabase
          .from('pagarme_config')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          console.error('[usePagarmeConfig] Error inserting Pagar.me config:', error);
          console.error('[usePagarmeConfig] Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('[usePagarmeConfig] Insert successful, data:', data);
        configId = data.id;
      }

      toast({
        title: "Configurações salvas!",
        description: (() => {
          const updatedFields = [];
          if (updates.public_key) updatedFields.push("Public Key");
          if (updates.secret_key) updatedFields.push("Secret Key");
          if (updates.webhook_secret) updatedFields.push("Webhook Secret");
          if (updates.environment) updatedFields.push("Ambiente");
          if (updates.stripe_custom_payment_method_id) updatedFields.push("Custom Payment Method ID");
          
          return updatedFields.length > 0 
            ? `Campos atualizados: ${updatedFields.join(', ')}`
            : "As configurações do Pagar.me foram atualizadas com sucesso.";
        })(),
      });

      // Refresh config
      await fetchConfig();
      return true;

    } catch (error: any) {
      console.error('[usePagarmeConfig] Error saving Pagar.me config:', error);
      console.error('[usePagarmeConfig] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
        toast({
          title: "Acesso negado",
          description: "Apenas administradores podem modificar as configurações do Pagar.me. Verifique suas permissões.",
          variant: "destructive"
        });
      } else if (error.code === '23502') {
        toast({
          title: "Dados incompletos",
          description: "Alguns campos obrigatórios estão faltando. Verifique se todos os dados necessários foram preenchidos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: `Não foi possível salvar as configurações: ${error.message || 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config?.has_secret_key) {
      toast({
        title: "Secret Key necessária",
        description: "Configure a Secret Key antes de testar a conexão.",
        variant: "destructive"
      });
      return false;
    }

    setTesting(true);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Normalizar environment antes de enviar
      const normalizeEnv = (uiEnv: string): 'test' | 'live' => {
        const v = (uiEnv || '').toLowerCase();
        if (['sandbox', 'teste', 'test'].includes(v)) return 'test';
        if (['live', 'prod', 'production', 'produção'].includes(v)) return 'live';
        return 'test';
      };
      
      const normalizedEnv = normalizeEnv(config.environment);
      
      console.log('[testConnection] Session check:', { 
        hasSession: !!sessionData.session,
        hasToken: !!sessionData.session?.access_token,
        originalEnvironment: config.environment,
        normalizedEnvironment: normalizedEnv
      });

      if (sessionError || !sessionData.session?.access_token) {
        console.error('[testConnection] Session error:', sessionError);
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para testar a conexão.",
          variant: "destructive"
        });
        return false;
      }

      console.log('[testConnection] Invoking edge function with environment:', normalizedEnv);

      const { data, error } = await supabase.functions.invoke('pagarme-test-connection', {
        body: { environment: normalizedEnv },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        console.error('[testConnection] Edge function error:', error);
        
        // Try to extract JSON error message from response
        try {
          // @ts-ignore - context.response may exist
          const responseText = await error?.context?.response?.text?.();
          if (responseText) {
            try {
              const errorJson = JSON.parse(responseText);
              const errorMsg = errorJson?.error?.message || errorJson?.message || responseText;
              throw new Error(errorMsg);
            } catch {
              throw new Error(responseText);
            }
          }
        } catch (parseError) {
          console.error('[testConnection] Error parsing failed:', parseError);
        }
        
        throw new Error(error.message || 'Falha ao testar conexão');
      }

      if (data?.success === false) {
        throw new Error(data?.error?.message || 'Falha na conexão');
      }

      console.log('[testConnection] Success:', data);

      toast({
        title: "Conexão testada com sucesso!",
        description: `Conectado ao ambiente ${config.environment} do Pagar.me.`,
      });
      return true;

    } catch (error: any) {
      console.error('[testConnection] Final error:', error);
      toast({
        title: "Erro na conexão",
        description: error.message || 'Erro desconhecido ao testar conexão',
        variant: "destructive"
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Computed values
  const isConfigured = config && config.has_secret_key && config.public_key;
  const hasCustomPaymentMethod = config && config.stripe_custom_payment_method_id;
  
  return {
    config,
    loading,
    saving,
    testing,
    upsertConfig,
    testConnection,
    refetch: fetchConfig,
    isConfigured,
    hasCustomPaymentMethod
  };
};