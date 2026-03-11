
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useUserRole } from '@/hooks/useUserRole';

interface StripeConfig {
  id: string;
  publishable_key: string | null;
  secret_key?: string | null; // Make optional for security
  webhook_secret?: string | null; // Make optional for security
  environment: 'test' | 'live';
  created_at: string;
  updated_at: string;
  has_webhook_secret?: boolean; // Security-safe indicator
}

interface SafeStripeConfig {
  id: string;
  publishable_key: string;
  environment: 'test' | 'live';
  created_at: string;
  updated_at: string;
  has_webhook_secret: boolean;
}

export const useStripeConfig = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { role, loading: roleLoading } = useUserRole();
  
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    // 🎯 FASE 1: SKIP TOTAL para usuários comuns - Stripe descontinuado
    if (role === 'user') {
      console.log('[useStripeConfig] USER role - Stripe disabled, skipping fetch');
      setConfig(null);
      setLoading(false);
      return;
    }

    // 🚫 Don't fetch while in password recovery flow
    const mustChange = typeof window !== "undefined" && localStorage.getItem("must_change_password") === "1";
    if (mustChange) {
      setLoading(false);
      return;
    }

    // Get current user to check authentication
    const { data: { user } } = await supabase.auth.getUser();
    try {
      if (user) {
        // For authenticated users, try to get full config (for super_admin)
        const { data: fullData, error: fullError } = await supabase
          .from('stripe_config')
          .select('*')
          .limit(1)
          .single();

        if (!fullError && fullData) {
          // User has full access (super_admin)
          const environment = fullData.environment === 'live' ? 'live' : 'test';
          setConfig({
            ...fullData,
            environment
          } as StripeConfig);
        } else {
          // Try safe config access (for admin)
          const { data: safeData, error: safeError } = await supabase
            .rpc('get_stripe_config_safe');

          if (!safeError && safeData && safeData.length > 0) {
            const safeConfig = safeData[0] as SafeStripeConfig;
            setConfig({
              id: safeConfig.id,
              publishable_key: safeConfig.publishable_key,
              webhook_secret: null, // Hidden for security
              environment: safeConfig.environment,
              created_at: safeConfig.created_at,
              updated_at: safeConfig.updated_at,
              has_webhook_secret: safeConfig.has_webhook_secret
            });
          } else {
            // 🎯 FASE 1: Sem toast para usuários comuns (Stripe descontinuado)
            console.log('[useStripeConfig] No Stripe config access - expected for non-admin users');
          }
        }
      } else {
        // For unauthenticated users (guests), try to get just the public publishable key
        const { data: safeData, error: safeError } = await supabase
          .rpc('get_stripe_config_safe');

        if (!safeError && safeData && safeData.length > 0) {
          const safeConfig = safeData[0] as SafeStripeConfig;
          setConfig({
            id: safeConfig.id,
            publishable_key: safeConfig.publishable_key,
            webhook_secret: null, // Hidden for security
            environment: safeConfig.environment,
            created_at: safeConfig.created_at,
            updated_at: safeConfig.updated_at,
            has_webhook_secret: safeConfig.has_webhook_secret
          });
        }
        // For guests, we don't show error messages if config is not accessible
        // We just continue without Stripe functionality
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao carregar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<Pick<StripeConfig, 'publishable_key' | 'secret_key' | 'webhook_secret' | 'environment'>>) => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stripe_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) {
        console.error('Error updating Stripe config:', error);
        
        // Check if it's a permission error
        if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
          toast({
            title: "Acesso negado",
            description: "Apenas super administradores podem modificar as configurações do Stripe.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar as configurações do Stripe.",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Configurações salvas!",
        description: (() => {
          const updatedFields = [];
          if (updates.publishable_key) updatedFields.push("Publishable Key");
          if (updates.secret_key) updatedFields.push("Secret Key");
          if (updates.webhook_secret) updatedFields.push("Webhook Secret");
          if (updates.environment) updatedFields.push("Ambiente");
          
          return updatedFields.length > 0 
            ? `Campos atualizados: ${updatedFields.join(', ')}`
            : "As configurações do Stripe foram atualizadas com sucesso.";
        })(),
      });

      // Refresh config
      await fetchConfig();
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // 🎯 FASE 1: Aguardar role ser carregado antes de buscar config
    if (!roleLoading) {
      fetchConfig();
    }
  }, [role, roleLoading]);

  return {
    config,
    loading,
    saving,
    updateConfig,
    refetch: fetchConfig
  };
};
