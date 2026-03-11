
import React, { useEffect } from 'react';
import { LogOut, CheckCircle } from 'lucide-react';

const MetaLogout = () => {
  useEffect(() => {
    console.log('🔗 MetaLogout: Component mounted');
    console.log('🌐 MetaLogout: Current URL:', window.location.href);
    
    // Processar logout do Meta
    const handleMetaLogout = () => {
      console.log('🚪 MetaLogout: Processing Meta logout');
      
      // Se for popup, comunicar com parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'META_LOGOUT_SUCCESS'
        }, window.location.origin);
        
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        // Se não for popup, redirecionar para dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    };

    handleMetaLogout();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Logout Realizado</h2>
        <p className="text-gray-600 mb-4">
          Sua sessão do Meta foi encerrada com sucesso.
        </p>
        <div className="flex items-center justify-center space-x-2">
          <LogOut className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Redirecionando...</span>
        </div>
        
        <p className="text-xs text-gray-400 mt-6">
          Esta janela será fechada automaticamente.
        </p>
      </div>
    </div>
  );
};

export default MetaLogout;
