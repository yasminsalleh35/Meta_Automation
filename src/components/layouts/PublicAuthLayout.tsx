import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRecoveryState } from '@/hooks/useRecoveryState';

const PublicAuthLayout: React.FC = () => {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const { isActiveRecovery } = useRecoveryState();

  // Permitir acesso durante recovery, mesmo se autenticado
  if (isActiveRecovery) {
    console.log('PublicAuthLayout: Recovery flow detected, allowing access');
    return <Outlet />;
  }

  // Permitir acesso se usuário precisa trocar senha
  if (mustChangePassword) {
    return <Outlet />;
  }

  // Redirecionar usuários autenticados (e que não precisam trocar senha) para dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicAuthLayout;