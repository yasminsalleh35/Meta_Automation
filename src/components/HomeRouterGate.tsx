import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityFallback } from '@/hooks/useSecurityFallback';

const HomeRouterGate: React.FC = () => {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const [stabilized, setStabilized] = useState(false);
  
  // 🚨 FASE 5: Fallback de segurança contra loops infinitos
  useSecurityFallback('HomeRouterGate');

  // 🔒 FASE 1: Aguardar estabilização do estado de auth
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setStabilized(true), 100);
      return () => clearTimeout(timer);
    } else {
      setStabilized(false);
    }
  }, [loading]);

  // Aguardar carregamento e estabilização
  if (loading || !stabilized) return null;

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (mustChangePassword) return <Navigate to="/auth/reset-password" replace />;

  return <Navigate to="/dashboard" replace />;
};

export default HomeRouterGate;