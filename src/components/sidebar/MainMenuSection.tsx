
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target,
  Image,
  Building
} from 'lucide-react';
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { useI18n } from '@/contexts/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  {
    title: 'sidebar.dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'sidebar.campaigns',
    url: '/dashboard/campaigns',
    icon: Target,
  },
  {
    title: 'Criativos',
    url: '/dashboard/media',
    icon: Image,
  },
  {
    title: 'Meu Negócio',
    url: '/dashboard/my-business',
    icon: Building,
  },
];

interface MainMenuSectionProps {
  isCollapsed?: boolean;
}

export function MainMenuSection({ isCollapsed = false }: MainMenuSectionProps) {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            const title = item.title.startsWith('sidebar.') ? t(item.title) : item.title;
            
            return (
              <SidebarMenuItem key={item.title}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className="justify-center w-10 h-10 p-0"
                      >
                        <Link to={item.url}>
                          <item.icon className="w-4 h-4" />
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
