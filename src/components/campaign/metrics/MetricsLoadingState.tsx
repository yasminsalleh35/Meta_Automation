
import React from 'react';
import { Loader2 } from 'lucide-react';

interface MetricsLoadingStateProps {
  className?: string;
}

export const MetricsLoadingState: React.FC<MetricsLoadingStateProps> = ({ className = "" }) => {
  return (
    <div className={`${className} space-y-4`}>
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <span className="text-sm text-gray-600">Carregando métricas em tempo real...</span>
        </div>
      </div>
      
      {/* Skeleton Loading */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
