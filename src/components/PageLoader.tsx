import React from 'react';
import { Loader2 } from 'lucide-react';

// audit PLT-04: fallback de <Suspense> para as rotas carregadas sob demanda (React.lazy).
export const PageLoader: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => (
  <div
    className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}
    role="status"
    aria-label="Carregando"
  >
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default PageLoader;
