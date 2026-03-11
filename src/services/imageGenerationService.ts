
interface ImageGenerationConfig {
  provider: 'dalle3' | 'midjourney' | 'stability';
  apiKey: string;
  model: string;
  enabled: boolean;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  provider: string;
  createdAt: string;
  cost: number;
  userId: string;
}

interface UsageMetrics {
  totalRequests: number;
  totalCost: number;
  lastReset: string;
  dailyLimit: number;
  monthlyLimit: number;
}

export class ImageGenerationService {
  private getConfig(): ImageGenerationConfig | null {
    const configStr = localStorage.getItem('camply_media_ai_providers');
    if (!configStr) return null;
    
    const providers = JSON.parse(configStr);
    const enabledProvider = providers.find((p: any) => p.enabled && p.type === 'image');
    
    if (!enabledProvider) return null;
    
    return {
      provider: enabledProvider.id as 'dalle3' | 'midjourney' | 'stability',
      apiKey: enabledProvider.apiKey,
      model: enabledProvider.model,
      enabled: true
    };
  }

  private async checkUsageLimits(userId: string): Promise<boolean> {
    const usage = this.getUserUsage(userId);
    
    // Check daily limit (exemplo: 50 imagens/dia)
    if (usage.totalRequests >= usage.dailyLimit) {
      throw new Error('Limite diário de geração de imagens atingido');
    }
    
    return true;
  }

  private getUserUsage(userId: string): UsageMetrics {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `camply_usage_${userId}_${today}`;
    const usage = localStorage.getItem(usageKey);
    
    if (!usage) {
      return {
        totalRequests: 0,
        totalCost: 0,
        lastReset: today,
        dailyLimit: 50,
        monthlyLimit: 1000
      };
    }
    
    return JSON.parse(usage);
  }

  private updateUsage(userId: string, cost: number): void {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `camply_usage_${userId}_${today}`;
    const usage = this.getUserUsage(userId);
    
    usage.totalRequests += 1;
    usage.totalCost += cost;
    
    localStorage.setItem(usageKey, JSON.stringify(usage));
  }

  async generateImage(prompt: string, userId: string): Promise<GeneratedImage> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Nenhum provedor de IA para imagens configurado');
    }

    await this.checkUsageLimits(userId);

    let imageUrl: string;
    let cost: number;

    try {
      switch (config.provider) {
        case 'dalle3':
          const result = await this.generateWithDALLE(prompt, config.apiKey);
          imageUrl = result.url;
          cost = 0.04; // $0.04 por imagem DALL-E 3
          break;
        case 'midjourney':
          // Implementação futura
          throw new Error('Midjourney ainda não implementado');
        case 'stability':
          // Implementação futura
          throw new Error('Stability AI ainda não implementado');
        default:
          throw new Error('Provedor não suportado');
      }

      const generatedImage: GeneratedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt,
        provider: config.provider,
        createdAt: new Date().toISOString(),
        cost,
        userId
      };

      // Salvar imagem gerada
      this.saveGeneratedImage(generatedImage);
      
      // Atualizar métricas de uso
      this.updateUsage(userId, cost);

      return generatedImage;
    } catch (error) {
      console.error('Erro na geração de imagem:', error);
      throw error;
    }
  }

  private async generateWithDALLE(prompt: string, apiKey: string): Promise<{ url: string }> {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E API Error: ${error.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    return { url: data.data[0].url };
  }

  private saveGeneratedImage(image: GeneratedImage): void {
    const existingImages = this.getGeneratedImages();
    existingImages.unshift(image);
    
    // Manter apenas as últimas 100 imagens
    const limitedImages = existingImages.slice(0, 100);
    localStorage.setItem('camply_generated_media', JSON.stringify(limitedImages));
  }

  getGeneratedImages(): GeneratedImage[] {
    const saved = localStorage.getItem('camply_generated_media');
    return saved ? JSON.parse(saved) : [];
  }

  getUserMetrics(userId: string): UsageMetrics {
    return this.getUserUsage(userId);
  }
}

export const imageGenerationService = new ImageGenerationService();
