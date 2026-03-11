
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Janela de tempo em ms
}

export class AIRateLimitService {
  private static instance: AIRateLimitService;
  private limits: Map<string, RateLimitEntry> = new Map();
  
  // Configurações por tipo de usuário
  private configs: Record<string, RateLimitConfig> = {
    free: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 por hora
    pro: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 por hora
    enterprise: { maxRequests: 1000, windowMs: 60 * 60 * 1000 } // 1000 por hora
  };

  static getInstance(): AIRateLimitService {
    if (!AIRateLimitService.instance) {
      AIRateLimitService.instance = new AIRateLimitService();
    }
    return AIRateLimitService.instance;
  }

  private getKey(userId: string, feature: string): string {
    return `${userId}_${feature}`;
  }

  checkLimit(userId: string, userPlan: string = 'free', feature: string = 'ai_suggestion'): boolean {
    const key = this.getKey(userId, feature);
    const config = this.configs[userPlan] || this.configs.free;
    const now = Date.now();
    
    let entry = this.limits.get(key);
    
    // Se não existe ou a janela expirou, resetar
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      this.limits.set(key, entry);
    }
    
    // Verificar limite
    if (entry.count >= config.maxRequests) {
      return false;
    }
    
    // Incrementar contador
    entry.count++;
    this.limits.set(key, entry);
    
    return true;
  }

  getRemainingRequests(userId: string, userPlan: string = 'free', feature: string = 'ai_suggestion'): number {
    const key = this.getKey(userId, feature);
    const config = this.configs[userPlan] || this.configs.free;
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() >= entry.resetTime) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - entry.count);
  }

  getResetTime(userId: string, feature: string = 'ai_suggestion'): number {
    const key = this.getKey(userId, feature);
    const entry = this.limits.get(key);
    
    return entry?.resetTime || Date.now();
  }

  updateConfig(plan: string, config: RateLimitConfig): void {
    this.configs[plan] = config;
  }
}

export const aiRateLimitService = AIRateLimitService.getInstance();
