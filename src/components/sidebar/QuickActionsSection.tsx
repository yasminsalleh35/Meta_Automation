
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap, BarChart3 } from 'lucide-react';
import { 
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const quickActions = [
  {
    title: 'Nova Campanha',
    url: '/dashboard/simple-campaign-wizard',
    icon: Plus,
    variant: 'default' as const
  },
  {
    title: 'Campanhas',
    url: '/dashboard/campaigns',
    icon: BarChart3,
    variant: 'outline' as const
  }
];

interface QuickActionsSectionProps {
  isCollapsed?: boolean;
}

export function QuickActionsSection({ isCollapsed = false }: QuickActionsSectionProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className={`px-2 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {quickActions.map((action) => (
            isCollapsed ? (
              <Tooltip key={action.title}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="w-10 h-10 p-0 flex-shrink-0"
                    asChild
                  >
                    <Link to={action.url}>
                      <action.icon className="w-4 h-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{action.title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                key={action.title}
                variant={action.variant}
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link to={action.url}>
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.title}
                </Link>
              </Button>
            )
          ))}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
