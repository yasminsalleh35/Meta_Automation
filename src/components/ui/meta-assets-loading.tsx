import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress?: number;
}

interface MetaAssetsLoadingProps {
  steps: LoadingStep[];
  totalProgress: number;
  retryCount?: number;
  nextRetryIn?: number;
}

export const MetaAssetsLoading: React.FC<MetaAssetsLoadingProps> = ({
  steps,
  totalProgress,
  retryCount = 0,
  nextRetryIn
}) => {
  return (
    <Card className="p-4 space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Carregando ativos Meta</span>
          <span className="text-muted-foreground">{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      {/* Detailed Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            {step.status === 'loading' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            {step.status === 'success' && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {step.status === 'pending' && (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
            {step.status === 'error' && (
              <div className="h-4 w-4 rounded-full bg-red-500" />
            )}
            
            <span className={step.status === 'success' ? 'text-green-600' : ''}>
              {step.label}
            </span>
            
            {step.progress !== undefined && step.status === 'loading' && (
              <span className="text-muted-foreground ml-auto">
                {Math.round(step.progress)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Retry Information */}
      {retryCount > 0 && (
        <div className="text-xs text-orange-600 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Tentativa {retryCount} de 3
          {nextRetryIn && ` • Próximo retry em ${nextRetryIn}s`}
        </div>
      )}
    </Card>
  );
};
