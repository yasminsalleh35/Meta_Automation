
import { useState, useEffect } from 'react';

export interface PermissionLevel {
  scopes: string[];
  description: string;
  features: string[];
}

export interface PermissionLevels {
  required: PermissionLevel;
}

export const useMetaAdsPermissionLevels = () => {
  const [permissionLevels] = useState<PermissionLevels>({
    required: {
      scopes: [
        'pages_show_list',
        'pages_read_engagement', 
        'ads_management',
        'instagram_basic',
        'public_profile',
        'business_management',
        'instagram_manage_insights',
        'ads_read',
        'read_insights',
        'whatsapp_business_management'
      ],
      description: 'Permissões necessárias para integração completa com Meta Ads',
      features: [
        'Listar e selecionar contas de anúncios',
        'Acessar e gerenciar páginas do Facebook',
        'Conectar contas do Instagram Business',
        'Criar e gerenciar campanhas publicitárias',
        'Acessar insights e métricas avançadas',
        'Gerenciar Business Manager',
        'Selecionar números WhatsApp Business'
      ]
    }
  });

  return {
    permissionLevels
  };
};
