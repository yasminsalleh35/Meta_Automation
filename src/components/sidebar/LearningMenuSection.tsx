
import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Video } from 'lucide-react';
import {
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { useI18n } from '@/contexts/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const learningItems = [
  {
    title: 'sidebar.tutorials',
    url: '/dashboard/tutorials',
    icon: Video,
  },
  {
    title: 'sidebar.support',
    url: '/dashboard/support',
    icon: HelpCircle,
  },
];

interface LearningMenuSectionProps {
  isCollapsed?: boolean;
}

export function LearningMenuSection({ isCollapsed = false }: LearningMenuSectionProps) {
  const { t } = useI18n();

  return (
    <>
      {learningItems.map((item) => {
        const title = t(item.title);
        
        return (
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
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton asChild>
                <Link to={item.url}>
                  <item.icon className="w-4 h-4" />
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
