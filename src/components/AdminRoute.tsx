
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading, error, role } = useUserRole();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  console.log('AdminRoute: Rendering with states:', {
    authLoading,
    isAuthenticated,
    roleLoading,
    isAdmin,
    role,
    error,
    hasCheckedRole,
    shouldRedirect,
    cacheStatus: localStorage.getItem('user_role_cache') ? 'present' : 'missing'
  });

  // Effect para debounce da verificação de role
  useEffect(() => {
    if (!authLoading && isAuthenticated && !roleLoading && role !== null) {
      const timeoutId = setTimeout(() => {
        setHasCheckedRole(true);
        if (!isAdmin) {
          console.log('AdminRoute: Setting redirect flag for non-admin user');
          setShouldRedirect(true);
        }
      }, 50); // Pequeno delay para evitar race conditions

      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, isAuthenticated, roleLoading, isAdmin, role]);

  // Se ainda está carregando autenticação, mostrar loading
  if (authLoading) {
    console.log('AdminRoute: Showing auth loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para auth/login
  if (!isAuthenticated) {
    console.log('AdminRoute: Not authenticated, redirecting to auth/login');
    return <Navigate to="/auth/login" replace />;
  }

  // Se ainda está verificando role, mostrar loading
  if (roleLoading || (!hasCheckedRole && role === null)) {
    console.log('AdminRoute: Showing role loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem com fallback
  if (error && hasCheckedRole) {
    console.log('AdminRoute: Error occurred:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro de Autenticação
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2"
              >
                Tentar Novamente
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se deve redirecionar (não admin), fazer o redirecionamento
  if (shouldRedirect || (hasCheckedRole && !isAdmin)) {
    console.log('AdminRoute: Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Se passou por todas as verificações e é admin, renderizar children
  if (hasCheckedRole && isAdmin) {
    console.log('AdminRoute: User is admin, rendering children');
    return <>{children}</>;
  }

  // Loading de segurança
  console.log('AdminRoute: Fallback loading');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
};

export default AdminRoute;
