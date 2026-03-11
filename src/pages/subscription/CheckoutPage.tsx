// ⚠️ DEPRECATED: Este componente usa Pagar.me SDK V1 (legado)
// ✅ Use /checkout (src/pages/checkout/index.tsx) para Pagar.me V5
// Este arquivo apenas redireciona para o novo componente

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.warn('🔄 [DEPRECATED] Redirecting from legacy CheckoutPage (V1) to V5 checkout...');
    const plan = searchParams.get('plan');
    const newPath = `/checkout${plan ? `?plan=${plan}` : ''}`;
    console.log(`→ Redirecting to: ${newPath}`);
    navigate(newPath, { replace: true });
  }, [navigate, searchParams]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecionando para checkout V5...</p>
      </div>
    </div>
  );
}
