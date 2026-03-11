
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';

interface CustomerPortalButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function CustomerPortalButton({ 
  variant = 'outline', 
  size = 'default',
  className = ''
}: CustomerPortalButtonProps) {
  const { openCustomerPortal, loading } = useCustomerPortal();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openCustomerPortal}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ExternalLink className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Carregando...' : 'Gerenciar Pagamentos'}
    </Button>
  );
}
