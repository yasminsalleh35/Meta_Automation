
import React, { useState, useEffect } from 'react';
import { SidebarUserInfo } from '@/components/sidebar/SidebarUserInfo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { GraduationCap, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useI18n } from '@/contexts/I18nContext';
import { useLocation } from 'react-router-dom';
import { QuickActionsSection } from '@/components/sidebar/QuickActionsSection';
import { MainMenuSection } from '@/components/sidebar/MainMenuSection';
import { LearningMenuSection } from '@/components/sidebar/LearningMenuSection';
import { ConfigMenuSection } from '@/components/sidebar/ConfigMenuSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const { isMobile } = useResponsive();
  const { t } = useI18n();
  const location = useLocation();
  const isCollapsed = state === 'collapsed' && !isMobile;

  // Estado para controlar se cada seção está aberta
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Auto-abrir seções baseado na rota atual
  useEffect(() => {
    const pathname = location.pathname;
    
    // Rotas de aprendizado
    const learningRoutes = ['/dashboard/tutorials', '/dashboard/guides', '/dashboard/support'];
    if (learningRoutes.some(route => pathname.startsWith(route))) {
      setIsLearningOpen(true);
    }
    
    // Rotas de configuração
    const configRoutes = ['/dashboard/notifications', '/dashboard/integrations', '/dashboard/settings', '/admin/settings'];
    if (configRoutes.some(route => pathname.startsWith(route))) {
      setIsConfigOpen(true);
    }
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="safe-area-inset-left">
      <SidebarHeader className="border-b px-4 sm:px-6 py-6 safe-area-inset-top">
        <div className="flex items-center justify-center">
          {(!isCollapsed || isMobile) ? (
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply"
              className="h-10 w-auto"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center touch-target">
              <span className="text-white font-bold text-base">C</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Quick Actions */}
        <QuickActionsSection isCollapsed={isCollapsed && !isMobile} />

        {/* Main Menu */}
        <MainMenuSection isCollapsed={isCollapsed && !isMobile} />

        {/* Learning Center - Collapsible */}
        {(isCollapsed && !isMobile) ? (
          <SidebarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarGroupLabel className="flex items-center cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </SidebarGroupLabel>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Aprendizado</p>
              </TooltipContent>
            </Tooltip>
          </SidebarGroup>
        ) : (
          <Collapsible open={isLearningOpen} onOpenChange={setIsLearningOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Aprendizado</span>
                  </div>
                  {isLearningOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="pl-2">
                  <SidebarMenu>
                    <LearningMenuSection isCollapsed={isCollapsed && !isMobile} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Configurations - Collapsible */}
        {(isCollapsed && !isMobile) ? (
          <SidebarGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarGroupLabel className="flex items-center cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <Settings className="w-5 h-5" />
                </SidebarGroupLabel>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
          </SidebarGroup>
        ) : (
          <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </div>
                  {isConfigOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="pl-2">
                  <SidebarMenu>
                    <ConfigMenuSection isCollapsed={isCollapsed && !isMobile} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarUserInfo />
    </Sidebar>
    </TooltipProvider>
  );
}
