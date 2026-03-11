
import { useToast } from '@/hooks/use-toast';
import { aiRateLimitService } from '@/services/aiRateLimitService';

export const useAIRateLimit = () => {
  const { toast } = useToast();

  const checkRateLimit = (userId: string, userPlan: string, operation: 'ai_suggestion' | 'image_generation') => {
    if (!aiRateLimitService.checkLimit(userId, userPlan, operation)) {
      const remaining = aiRateLimitService.getRemainingRequests(userId, userPlan, operation);
      const resetTime = new Date(aiRateLimitService.getResetTime(userId, operation));
      
      const operationLimit = userPlan === 'free' ? (operation === 'ai_suggestion' ? '10' : '5') : '100';
      const operationName = operation === 'ai_suggestion' ? 'sugestões' : 'imagens';
      
      toast({
        title: "Limite de uso atingido",
        description: `Você atingiu o limite de ${operationLimit} ${operationName} por hora. Próximo reset: ${resetTime.toLocaleTimeString()}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const getUsageStats = () => {
    const userId = 'user_1'; // TODO: Pegar do contexto de auth
    const userPlan = 'free'; // TODO: Pegar do contexto de assinatura
    
    return {
      suggestions: {
        remaining: aiRateLimitService.getRemainingRequests(userId, userPlan, 'ai_suggestion'),
        resetTime: new Date(aiRateLimitService.getResetTime(userId, 'ai_suggestion'))
      },
      images: {
        remaining: aiRateLimitService.getRemainingRequests(userId, userPlan, 'image_generation'),
        resetTime: new Date(aiRateLimitService.getResetTime(userId, 'image_generation'))
      }
    };
  };

  return {
    checkRateLimit,
    getUsageStats
  };
};
