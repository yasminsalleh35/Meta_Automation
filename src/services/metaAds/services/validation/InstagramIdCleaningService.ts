
export class InstagramIdCleaningService {
  /**
   * Limpa o ID do Instagram removendo o prefixo 'ig_' se presente
   */
  static cleanInstagramId(instagramId: string): string {
    console.log('📱 Original Instagram ID:', instagramId);
    
    const cleanedId = instagramId.startsWith('ig_') ? instagramId.replace('ig_', '') : instagramId;
    
    console.log('📱 Cleaned Instagram ID (without ig_ prefix):', cleanedId);
    
    const isNumeric = /^\d+$/.test(cleanedId);
    console.log('📱 Instagram ID is numeric:', isNumeric);
    
    if (!isNumeric) {
      console.warn('📱 Warning: Instagram ID is not purely numeric after cleaning:', cleanedId);
    }
    
    return cleanedId;
  }

  /**
   * Valida se o ID do Instagram tem formato correto após limpeza
   */
  static isValidInstagramId(cleanedId: string): boolean {
    return /^\d+$/.test(cleanedId);
  }
}
