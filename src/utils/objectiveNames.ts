
export const getObjectiveFriendlyName = (objective: string): string => {
  const objectiveNames: { [key: string]: string } = {
    'advantage_plus_leads': 'Captação para WhatsApp',
    'lead_generation': 'Geração de Leads',
    'reach': 'Alcance e Reconhecimento',
    'traffic': 'Tráfego para Site',
    'engagement': 'Engajamento',
    'conversions': 'Conversões',
    'app_installs': 'Instalações de App',
    'video_views': 'Visualizações de Vídeo',
    'brand_awareness': 'Reconhecimento da Marca',
    'messages': 'Mensagens'
  };
  
  return objectiveNames[objective] || objective;
};
