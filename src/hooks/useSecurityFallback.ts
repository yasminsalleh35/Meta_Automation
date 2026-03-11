import { useEffect, useRef } from 'react';

/**
 * 🚨 FASE 5: Fallback de Segurança
 * Hook que detecta e quebra loops infinitos de navegação
 */
export function useSecurityFallback(componentName: string) {
  const renderCountRef = useRef(0);
  const lastResetRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    
    // Reset contador a cada 5 segundos
    if (now - lastResetRef.current > 5000) {
      renderCountRef.current = 1;
      lastResetRef.current = now;
      return;
    }

    // Se renderizou mais de 20 vezes em 5 segundos = loop infinito
    if (renderCountRef.current > 20) {
      console.error(`🚨 SECURITY FALLBACK: Loop infinito detectado em ${componentName}`);
      
      // Limpar todos os flags e storage
      sessionStorage.removeItem('password_recovery_active');
      localStorage.removeItem('must_change_password');
      
      // Forçar navegação para login após 1 segundo
      setTimeout(() => {
        console.log('🚨 SECURITY FALLBACK: Redirecionando para login...');
        window.location.href = '/auth/login';
      }, 1000);
      
      renderCountRef.current = 0;
      lastResetRef.current = now;
    }
  }, [componentName]);

  return renderCountRef.current;
}