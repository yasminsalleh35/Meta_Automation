
import React, { createContext, useContext, useState } from 'react';

type Language = 'pt' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Header
    'header.user': 'Usuário',
    'header.profile': 'Perfil',
    'header.settings': 'Configurações',
    'header.logout': 'Sair',
    'header.loading': 'Carregando...',
    
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.quick_actions': 'Ações Rápidas',
    'sidebar.new_campaign': 'Nova Campanha',
    'sidebar.manage_campaigns': 'Gerenciar Campanhas',
    'sidebar.campaigns': 'Campanhas',
    'sidebar.analytics': 'Analytics',
    'sidebar.subscription': 'Assinatura',
    'sidebar.settings': 'Configurações',
    'sidebar.tutorials': 'Tutoriais',
    'sidebar.guides': 'Guias',
    'sidebar.support': 'Suporte',
    'sidebar.my_business': 'Meu Negócio',
    'sidebar.integrations': 'Integrações',
    'sidebar.advanced_settings': 'Configurações Avançadas',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.create': 'Criar',
    'common.update': 'Atualizar',
  },
  en: {
    // Header
    'header.user': 'User',
    'header.profile': 'Profile',
    'header.settings': 'Settings',
    'header.logout': 'Logout',
    'header.loading': 'Loading...',
    
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.quick_actions': 'Quick Actions',
    'sidebar.new_campaign': 'New Campaign',
    'sidebar.manage_campaigns': 'Manage Campaigns',
    'sidebar.campaigns': 'Campaigns',
    'sidebar.analytics': 'Analytics',
    'sidebar.subscription': 'Subscription',
    'sidebar.settings': 'Settings',
    'sidebar.tutorials': 'Tutorials',
    'sidebar.guides': 'Guides',
    'sidebar.support': 'Support',
    'sidebar.my_business': 'My Business',
    'sidebar.integrations': 'Integrations',
    'sidebar.advanced_settings': 'Advanced Settings',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.create': 'Create',
    'common.update': 'Update',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
