import React from 'react';
import { StripeProvider } from '@/providers/StripeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { isAuthRoute } from '@/utils/routerGuards';

interface ProvidersPrivadosProps {
  children: React.ReactNode;
}

const ProvidersPrivados: React.FC<ProvidersPrivadosProps> = ({ children }) => {
  // 🔒 FASE 4: Guard mais robusto para evitar execução durante transições
  const authResult = useAuth?.();
  const { isAuthenticated, mustChangePassword, loading } = authResult ?? { 
    isAuthenticated: false, 
    mustChangePassword: false, 
    loading: true 
  };
  
  // 🎯 FASE 2: Detectar role do usuário para desabilitar Stripe
  const { role, loading: roleLoading } = useUserRole();
  
  // 🔒 FASE 4: Função consolidada de recovery (sem sessionStorage)
  const isRecoveryFlow = () => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
  };
  
  // 🔒 FASE 4: Bloqueio durante loading, auth routes, não autenticado, ou recovery
  const shouldSkipMount = loading || roleLoading || isAuthRoute() || !isAuthenticated || mustChangePassword || isRecoveryFlow();
  
  const needsStripe = !shouldSkipMount && role === 'admin';

  if (shouldSkipMount) {
    console.log('[ProvidersPrivados] SKIP mount | loading:', loading, 'roleLoading:', roleLoading, 'isAuthRoute:', isAuthRoute(), 'isAuth:', isAuthenticated, 'mustChange:', mustChangePassword, 'recovery:', isRecoveryFlow());
  } else if (!needsStripe) {
    console.log('[ProvidersPrivados] USER role - Stripe disabled, skipping StripeProvider');
  } else {
    console.log('[ProvidersPrivados] ADMIN role - Stripe enabled, mounting StripeProvider');
  }

  // Always render the same tree structure to avoid React DOM reconciliation errors
  return needsStripe ? <StripeProvider>{children}</StripeProvider> : <div id="providers-privados">{children}</div>;
};

export default ProvidersPrivados;