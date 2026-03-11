
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Shield, Bell, Map, Link2 } from 'lucide-react';
import { 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { useI18n } from '@/contexts/I18nContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfigMenuSectionProps {
  isCollapsed?: boolean;
}

export function ConfigMenuSection({ isCollapsed = false }: ConfigMenuSectionProps) {
  const { t } = useI18n();
  const { isAdmin } = useUserRole();

  const configItems = [
    {
      title: t('menu.notifications'),
      url: '/dashboard/notifications',
      icon: Bell,
    },
    {
      title: 'Integrações',
      url: '/dashboard/integrations',
      icon: Link2,
    },
  ];

  // Admin-only configuration items
  const adminConfigItems = [
    {
      title: 'Configurações Gerais',
      url: '/admin/settings',
      icon: Settings,
    },
    {
      title: 'Configurações Mapbox',
      url: '/admin/settings/mapbox',
      icon: Map,
    },
  ];

  const allItems = [...configItems, ...(isAdmin ? adminConfigItems : [])];

  return (
    <>
      {allItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton 
                  asChild
                  className="justify-center w-10 h-10 p-0"
                >
                  <Link to={item.url}>
                    <item.icon className="w-4 h-4" />
                  </Link>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarMenuButton asChild>
              <Link to={item.url}>
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </>
  );
}
