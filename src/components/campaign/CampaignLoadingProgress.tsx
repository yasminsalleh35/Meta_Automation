import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const CampaignLoadingProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Conectando à Meta Ads...');

  useEffect(() => {
    const stages = [
      { progress: 20, message: 'Conectando à Meta Ads...', duration: 500 },
      { progress: 40, message: 'Buscando campanhas...', duration: 1500 },
      { progress: 60, message: 'Carregando detalhes...', duration: 2000 },
      { progress: 80, message: 'Processando métricas...', duration: 1500 },
      { progress: 95, message: 'Finalizando...', duration: 1000 },
    ];

    let currentStage = 0;
    let timeoutId: NodeJS.Timeout;

    const advanceStage = () => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setProgress(stage.progress);
        setMessage(stage.message);
        currentStage++;
        timeoutId = setTimeout(advanceStage, stage.duration);
      }
    };

    advanceStage();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-[400px] flex items-center justify-center animate-fade-in">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          </div>
          
          <div className="text-center space-y-2 w-full">
            <h3 className="text-lg font-semibold">Carregando suas campanhas</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {progress}% completo
            </p>
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>💡 <strong>Primeira vez?</strong> Pode levar até 20 segundos</p>
          <p>⚡ <strong>Próximas vezes:</strong> Instantâneo (cache de 10 min)</p>
        </div>
      </Card>
    </div>
  );
};
