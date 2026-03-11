/**
 * Sistema de monitoramento de chamadas à API do Meta
 * Rastreia todas as chamadas e alerta quando o limite está sendo excedido
 */

interface ApiCall {
  endpoint: string;
  reason: string;
  timestamp: number;
  queryKey?: string;
}

class ApiCallTracker {
  private calls: ApiCall[] = [];
  private callCount = 0;
  
  // Limites de alerta
  private readonly ALERT_THRESHOLD_5MIN = 50;
  private readonly ALERT_THRESHOLD_1HOUR = 200;
  private readonly WARNING_THRESHOLD_5MIN = 30;

  /**
   * Registra uma nova chamada à API
   */
  track(endpoint: string, reason: string, queryKey?: string) {
    this.callCount++;
    const call: ApiCall = {
      endpoint,
      reason,
      timestamp: Date.now(),
      queryKey
    };
    
    this.calls.push(call);
    
    // Log detalhado
    console.log(
      `📊 API Call #${this.callCount}: ${endpoint}`,
      `\n   Motivo: ${reason}`,
      queryKey ? `\n   QueryKey: ${queryKey}` : ''
    );

    // Verificar se está excedendo limites
    this.checkLimits();

    // Limpar chamadas antigas (mais de 1 hora)
    this.cleanup();
  }

  /**
   * Verifica se os limites estão sendo excedidos
   */
  private checkLimits() {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const callsLast5Min = this.calls.filter(c => c.timestamp > fiveMinAgo).length;
    const callsLastHour = this.calls.filter(c => c.timestamp > oneHourAgo).length;

    // Warning em 30 chamadas/5min
    if (callsLast5Min >= this.WARNING_THRESHOLD_5MIN) {
      console.warn(
        `⚠️ AVISO: ${callsLast5Min} chamadas nos últimos 5 minutos\n` +
        `   Limite recomendado: ${this.ALERT_THRESHOLD_5MIN}/5min`
      );
    }

    // Alerta crítico em 50 chamadas/5min
    if (callsLast5Min >= this.ALERT_THRESHOLD_5MIN) {
      console.error(
        `🚨 ALERTA CRÍTICO: ${callsLast5Min} chamadas nos últimos 5 minutos!\n` +
        `   Risco de rate limit do Meta!`
      );
      this.logTopEndpoints(fiveMinAgo);
    }

    // Alerta para limite de 1 hora (200 chamadas/hora do Meta)
    if (callsLastHour >= this.ALERT_THRESHOLD_1HOUR) {
      console.error(
        `🚨 LIMITE CRÍTICO: ${callsLastHour} chamadas na última hora!\n` +
        `   Limite do Meta: 200 chamadas/hora\n` +
        `   AÇÃO NECESSÁRIA: Reduzir chamadas imediatamente`
      );
      this.logTopEndpoints(oneHourAgo);
    }
  }

  /**
   * Lista os endpoints mais chamados
   */
  private logTopEndpoints(since: number) {
    const recentCalls = this.calls.filter(c => c.timestamp > since);
    const endpointCount = new Map<string, number>();

    recentCalls.forEach(call => {
      const count = endpointCount.get(call.endpoint) || 0;
      endpointCount.set(call.endpoint, count + 1);
    });

    const sorted = Array.from(endpointCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log('📈 Top 5 endpoints mais chamados:');
    sorted.forEach(([endpoint, count], index) => {
      console.log(`   ${index + 1}. ${endpoint}: ${count} chamadas`);
    });
  }

  /**
   * Remove chamadas antigas (mais de 1 hora)
   */
  private cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const beforeCount = this.calls.length;
    this.calls = this.calls.filter(c => c.timestamp > oneHourAgo);
    
    if (this.calls.length < beforeCount) {
      console.log(`🧹 Limpeza: ${beforeCount - this.calls.length} chamadas antigas removidas`);
    }
  }

  /**
   * Retorna estatísticas de uso
   */
  getStats(windowMinutes: number = 5) {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const since = now - windowMs;
    
    const recentCalls = this.calls.filter(c => c.timestamp > since);
    const endpointCount = new Map<string, number>();

    recentCalls.forEach(call => {
      const count = endpointCount.get(call.endpoint) || 0;
      endpointCount.set(call.endpoint, count + 1);
    });

    return {
      totalCalls: recentCalls.length,
      windowMinutes,
      endpoints: Object.fromEntries(endpointCount),
      averagePerMinute: recentCalls.length / windowMinutes
    };
  }

  /**
   * Reseta todos os contadores (útil para testes)
   */
  reset() {
    this.calls = [];
    this.callCount = 0;
    console.log('🔄 API Call Tracker resetado');
  }
}

// Instância singleton global
export const apiCallTracker = new ApiCallTracker();

/**
 * Helper para rastrear chamadas facilmente
 */
export const trackApiCall = (endpoint: string, reason: string, queryKey?: string) => {
  apiCallTracker.track(endpoint, reason, queryKey);
};
