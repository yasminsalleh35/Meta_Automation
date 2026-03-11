import { useState, useEffect } from 'react';
import { Search, Brain, PenTool, Sparkles } from 'lucide-react';

interface LoadingStage {
  id: number;
  message: string;
  icon: typeof Search;
  duration: number;
}

const loadingStages: LoadingStage[] = [
  { id: 1, message: '🔍 Analisando dados...', icon: Search, duration: 6000 },
  { id: 2, message: '🧠 Processando IA...', icon: Brain, duration: 6000 },
  { id: 3, message: '✍️ Redigindo textos...', icon: PenTool, duration: 6000 },
  { id: 4, message: '✨ Finalizando...', icon: Sparkles, duration: 6000 }
];

export const useAILoadingProgress = (isLoading: boolean) => {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setCurrentStageIndex(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const totalDuration = 24000; // 24 segundos

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      setElapsedTime(elapsed);

      // Calcular progresso (0-100%)
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(currentProgress);

      // Determinar estágio atual baseado no tempo
      const stageIndex = Math.min(
        Math.floor(elapsed / 6000), // 6 segundos por estágio
        loadingStages.length - 1
      );
      setCurrentStageIndex(stageIndex);

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  const currentStage = loadingStages[currentStageIndex];

  return {
    progress,
    currentStage,
    elapsedTime,
    isInFinalStage: currentStageIndex === loadingStages.length - 1
  };
};