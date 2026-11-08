
import React, { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildLoginPath } from '@/lib/safeRedirect';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSecurityFallback } from '@/hooks/useSecurityFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = memo(({ children }) => {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  // 🚨 FASE 5: Fallback de segurança contra loops infinitos
  useSecurityFallback('ProtectedRoute');

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to={buildLoginPath(location.pathname, location.search, location.hash)} replace />;
  }

  if (mustChangePassword) return <Navigate to="/auth/reset-password" replace />;

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
