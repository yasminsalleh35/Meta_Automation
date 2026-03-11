
export class MetaAdsValidationUtils {
  // Validate WhatsApp number format
  static validateWhatsAppNumber(link: string): boolean {
    // More flexible WhatsApp pattern validation
    const whatsAppPatterns = [
      /^https:\/\/wa\.me\/\d{10,15}(\?text=.*)?$/,
      /^https:\/\/api\.whatsapp\.com\/send\?phone=\d{10,15}.*$/,
      /^https:\/\/chat\.whatsapp\.com\/.*$/
    ];
    
    return whatsAppPatterns.some(pattern => pattern.test(link));
  }

  // Helper method to format ad account ID
  static formatAdAccountId(adAccountId: string): string {
    // Remove 'act_' prefix if it exists, then add it back
    const cleanId = adAccountId.replace(/^act_/, '');
    return `act_${cleanId}`;
  }

  // Generate campaign name with timestamp
  static generateCampaignName(): string {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    return `Campanha WhatsApp - ${timestamp}`;
  }

  // Validate campaign configuration for lead generation
  static validateLeadCampaignConfig(pageId: string, whatsappLink: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pageId) {
      errors.push('ID da página é obrigatório para campanhas de leads');
    }

    if (!this.validateWhatsAppNumber(whatsappLink)) {
      errors.push('Link do WhatsApp deve estar no formato: https://wa.me/5511999999999');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate creative upload result
  static validateCreativeUpload(uploadResult: { hash?: string; video_id?: string }): { isValid: boolean; error?: string } {
    if (!uploadResult.hash && !uploadResult.video_id) {
      return {
        isValid: false,
        error: 'Nenhum criativo foi carregado. Faça upload de uma imagem ou vídeo.'
      };
    }

    return { isValid: true };
  }

  // Validate call-to-action configuration
  static getValidCallToActionType(link: string): string {
    // Check if it's a WhatsApp link and return appropriate CTA type
    if (this.validateWhatsAppNumber(link)) {
      return 'WHATSAPP_MESSAGE';
    }
    
    // Default fallback
    return 'LEARN_MORE';
  }

  // Check if targeting is too restrictive
  static validateTargeting(targeting: any): { isValid: boolean; warning?: string } {
    // Basic validation for targeting scope
    if (targeting.geo_locations?.regions && targeting.geo_locations.regions.length > 0) {
      return { isValid: true };
    }
    
    if (targeting.geo_locations?.countries && targeting.geo_locations.countries.includes('BR')) {
      return { isValid: true };
    }

    return {
      isValid: false,
      warning: 'Targeting muito restritivo. Considere usar targeting por país inicialmente.'
    };
  }

  // Validate budget for lead generation campaigns
  static validateBudget(dailyBudget: number): { isValid: boolean; recommendation?: string } {
    const minBudget = 20; // Meta's minimum for BR
    const recommendedMinimum = 50; // Better for lead generation

    if (dailyBudget < minBudget) {
      return {
        isValid: false,
        recommendation: `Orçamento mínimo é R$ ${minBudget}/dia`
      };
    }

    if (dailyBudget < recommendedMinimum) {
      return {
        isValid: true,
        recommendation: `Para melhores resultados em leads, recomendamos pelo menos R$ ${recommendedMinimum}/dia`
      };
    }

    return { isValid: true };
  }
}
