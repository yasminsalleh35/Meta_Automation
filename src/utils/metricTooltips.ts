
interface MetricTooltip {
  title: string;
  description: string;
}

export const getMetricTooltip = (metric: string, objective?: string): MetricTooltip => {
  const isWhatsAppLead = objective?.toLowerCase().includes('whatsapp') || objective?.toLowerCase().includes('lead');
  const isWebsiteTraffic = objective?.toLowerCase().includes('site') || objective?.toLowerCase().includes('tráfego');
  const isSales = objective?.toLowerCase().includes('vend') || objective?.toLowerCase().includes('venda');
  const isEngagement = objective?.toLowerCase().includes('curtida') || objective?.toLowerCase().includes('engajamento');

  switch (metric) {
    case 'impressions':
      return {
        title: 'Impressões',
        description: 'Quantas vezes sua campanha foi exibida para as pessoas no Facebook e Instagram. É como contar quantas pessoas "viram" seu anúncio.'
      };

    case 'clicks':
      return {
        title: 'Cliques',
        description: isWhatsAppLead 
          ? 'Quantas pessoas clicaram no seu anúncio para conversar com você no WhatsApp.'
          : 'Quantas pessoas clicaram no seu anúncio para saber mais sobre seu produto ou serviço.'
      };

    case 'leads':
      return {
        title: 'Leads',
        description: isWhatsAppLead
          ? 'Quantas pessoas demonstraram interesse real no seu negócio entrando em contato pelo WhatsApp.'
          : 'Quantas pessoas demonstraram interesse real no seu negócio, deixando dados de contato ou enviando mensagem.'
      };

    case 'cpa':
      return {
        title: 'CPA (Custo por Aquisição)',
        description: isWhatsAppLead
          ? 'Quanto você gastou em média para cada pessoa que te chamou no WhatsApp. Quanto menor, melhor!'
          : isEngagement
          ? 'Quanto você gastou em média para cada curtida ou interação. Quanto menor, melhor!'
          : 'Quanto você gastou em média para cada cliente em potencial. Quanto menor, melhor!'
      };

    case 'ctr':
      return {
        title: 'CTR (Taxa de Cliques)',
        description: 'De cada 100 pessoas que viram seu anúncio, quantas clicaram nele. Uma taxa alta significa que seu anúncio é atrativo!'
      };

    case 'roas':
      return {
        title: 'ROAS (Retorno do Investimento)',
        description: isSales
          ? 'Para cada R$ 1,00 investido, quanto você faturou de volta. Ex: 3x = R$ 3,00 de faturamento para cada R$ 1,00 investido.'
          : 'Indica o retorno que sua campanha está gerando. Quanto maior, melhor o desempenho!'
      };

    case 'reach':
      return {
        title: 'Alcance',
        description: 'Quantas pessoas únicas viram sua campanha. É diferente de impressões porque conta cada pessoa apenas uma vez.'
      };

    case 'conversions':
      return {
        title: 'Conversões',
        description: isWhatsAppLead
          ? 'Quantas pessoas fizeram a ação desejada: te chamaram no WhatsApp ou preencheram um formulário.'
          : isSales
          ? 'Quantas pessoas fizeram a ação desejada: compraram seu produto ou serviço.'
          : 'Quantas pessoas fizeram a ação que você queria: se inscrever, baixar, comprar, etc.'
      };

    case 'budget':
      return {
        title: 'Orçamento',
        description: 'Quanto você definiu para gastar nesta campanha. O Facebook distribui esse valor ao longo do período da campanha.'
      };

    case 'spent':
      return {
        title: 'Valor Gasto',
        description: 'Quanto já foi investido nesta campanha até agora. Este valor é atualizado em tempo real pelo Facebook.'
      };

    default:
      return {
        title: 'Métrica',
        description: 'Esta métrica mostra informações importantes sobre o desempenho da sua campanha.'
      };
  }
};
