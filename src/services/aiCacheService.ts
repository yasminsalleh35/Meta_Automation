
interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

export class AICacheService {
  private static instance: AICacheService;
  private cache: Map<string, CacheEntry> = new Map();
  
  static getInstance(): AICacheService {
    if (!AICacheService.instance) {
      AICacheService.instance = new AICacheService();
    }
    return AICacheService.instance;
  }

  private generateKey(objective: string, businessData: any): string {
    const businessHash = JSON.stringify(businessData || {});
    return `ai_suggestion_${objective}_${btoa(businessHash).slice(0, 10)}`;
  }

  set(objective: string, businessData: any, suggestions: any, ttlHours = 24): void {
    const key = this.generateKey(objective, businessData);
    const ttl = ttlHours * 60 * 60 * 1000; // Converter para ms
    
    this.cache.set(key, {
      key,
      data: suggestions,
      timestamp: Date.now(),
      ttl
    });

    // Salvar no localStorage também
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('camply_ai_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao salvar cache no localStorage:', error);
    }
  }

  get(objective: string, businessData: any): any | null {
    const key = this.generateKey(objective, businessData);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar se não expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('camply_ai_cache');
  }

  loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('camply_ai_cache');
      if (saved) {
        const cacheData = JSON.parse(saved);
        this.cache = new Map(cacheData);
        
        // Limpar entradas expiradas
        this.cleanExpired();
      }
    } catch (error) {
      console.warn('Erro ao carregar cache do localStorage:', error);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { totalEntries: number; totalSize: string } {
    const entries = Array.from(this.cache.values());
    const totalSize = JSON.stringify(entries).length;
    
    return {
      totalEntries: entries.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }
}

export const aiCacheService = AICacheService.getInstance();
