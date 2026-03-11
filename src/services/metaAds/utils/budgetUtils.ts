
/**
 * Utilitários para conversão e validação de orçamento conforme Meta API
 * Baseado na documentação: https://developers.facebook.com/docs/marketing-api/reference/ad-set/fields#budget
 */

// Constantes para orçamento brasileiro
export const BUDGET_CONSTANTS = {
  MIN_DAILY_BRL: 20,
  MAX_DAILY_BRL: 50000,
  CURRENCY: 'BRL',
  CENTS_MULTIPLIER: 100
} as const;

export class BudgetUtils {
  /**
   * Converte valor em reais para centavos (formato exigido pela Meta API)
   */
  static convertToCents(valueInReais: number): number {
    const cents = Math.round(valueInReais * BUDGET_CONSTANTS.CENTS_MULTIPLIER);
    console.log(`💰 Budget conversion: R$ ${valueInReais} → ${cents} centavos`);
    return cents;
  }

  /**
   * Converte centavos para reais para exibição
   */
  static convertToReais(valueInCents: number): number {
    const reais = valueInCents / BUDGET_CONSTANTS.CENTS_MULTIPLIER;
    console.log(`💰 Budget conversion: ${valueInCents} centavos → R$ ${reais}`);
    return reais;
  }

  /**
   * Valida orçamento diário conforme limites do Meta para Brasil
   */
  static validateDailyBudget(dailyBudgetInReais: number): { 
    isValid: boolean; 
    error?: string; 
    valueInCents: number;
    errorType?: 'min' | 'max' | 'invalid';
  } {
    // Verificar se é um número válido
    if (!dailyBudgetInReais || isNaN(dailyBudgetInReais) || dailyBudgetInReais <= 0) {
      return {
        isValid: false,
        error: 'Orçamento deve ser um valor positivo',
        valueInCents: 0,
        errorType: 'invalid'
      };
    }

    if (dailyBudgetInReais < BUDGET_CONSTANTS.MIN_DAILY_BRL) {
      return {
        isValid: false,
        error: `Orçamento mínimo é R$ ${BUDGET_CONSTANTS.MIN_DAILY_BRL}/dia`,
        valueInCents: 0,
        errorType: 'min'
      };
    }

    if (dailyBudgetInReais > BUDGET_CONSTANTS.MAX_DAILY_BRL) {
      return {
        isValid: false,
        error: `Orçamento máximo é R$ ${BUDGET_CONSTANTS.MAX_DAILY_BRL}/dia`,
        valueInCents: 0,
        errorType: 'max'
      };
    }

    const valueInCents = this.convertToCents(dailyBudgetInReais);
    
    console.log(`✅ Budget validation passed: R$ ${dailyBudgetInReais} (${valueInCents} centavos)`);
    
    return {
      isValid: true,
      valueInCents
    };
  }

  /**
   * Formata orçamento para logs de debug
   */
  static formatBudgetForLog(valueInCents: number): string {
    const reais = this.convertToReais(valueInCents);
    return `${valueInCents} centavos (R$ ${reais})`;
  }

  /**
   * Verifica se o orçamento está na faixa recomendada
   */
  static getBudgetRecommendation(dailyBudgetInReais: number): {
    level: 'low' | 'recommended' | 'high';
    message: string;
  } {
    if (dailyBudgetInReais < 50) {
      return {
        level: 'low',
        message: 'Considere um orçamento maior para melhores resultados'
      };
    }
    
    if (dailyBudgetInReais <= 150) {
      return {
        level: 'recommended',
        message: 'Orçamento na faixa recomendada'
      };
    }
    
    return {
      level: 'high',
      message: 'Orçamento alto - ótimo para máximo alcance'
    };
  }
}
