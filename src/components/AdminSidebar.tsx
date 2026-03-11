
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  User,
  Map,
  Building2,
  Target,
  GraduationCap,
  HeadphonesIcon,
  Bot,
  Image,
  Activity,
  Facebook,
  DollarSign,
  Wallet,
  Layers,
  Brain,
  UserCheck,
  Package,
  FlaskConical,
  AlertTriangle,
  FileBarChart,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useResponsive } from '@/hooks/useResponsive';

export function AdminSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { state } = useSidebar();
  const { isMobile } = useResponsive();
  const location = useLocation();
  const isCollapsed = state === 'collapsed' && !isMobile;

  if (!isAdmin) {
    return null;
  }

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const adminMenuItems = [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Usuários',
      url: '/admin/users',
      icon: Users,
    },
    {
      title: 'Assinaturas',
      url: '/admin/subscriptions',
      icon: CreditCard,
    },
    {
      title: 'Planos',
      url: '/admin/plans',
      icon: Package,
    },
    {
      title: 'Setores',
      url: '/admin/sectors',
      icon: Layers,
    },
  ];

  const integrationItems = [
    {
      title: 'Meta Ads',
      url: '/admin/integrations/meta-ads',
      icon: Facebook,
    },
    {
      title: 'Meta Test Lab',
      url: '/admin/meta-test-lab',
      icon: FlaskConical,
    },
    {
      title: 'Tutorial Meta Ads',
      url: '/admin/integrations/meta-ads-tutorial',
      icon: GraduationCap,
    },
    {
      title: 'Pagar.me',
      url: '/admin/integrations/pagarme',
      icon: DollarSign,
    },
    {
      title: 'Asaas',
      url: '/admin/integrations/asaas',
      icon: Wallet,
    },
  ];

  const businessItems = [
    {
      title: 'Quizzes',
      url: '/admin/quizzes',
      icon: ClipboardList,
    },
    {
      title: 'Leads',
      url: '/admin/leads',
      icon: UserCheck,
    },
    {
      title: 'Centro de Aprendizado',
      url: '/admin/learning',
      icon: GraduationCap,
    },
    {
      title: 'Negócios dos Clientes',
      url: '/admin/client-businesses',
      icon: Building2,
    },
    {
      title: 'Campanhas dos Clientes',
      url: '/admin/client-campaigns',
      icon: Target,
    },
    {
      title: 'Perfis de Campanha',
      url: '/admin/campaign-profiles',
      icon: Target,
    },
    {
      title: 'Contingência',
      url: '/admin/contingency',
      icon: AlertTriangle,
    },
    {
      title: 'Notificações',
      url: '/admin/notifications',
      icon: Bot,
    },
    {
      title: 'Relatório Personalizado',
      url: '/admin/custom-report',
      icon: FileBarChart,
    },
  ];

  const aiItems = [
    {
      title: 'Integração IA',
      url: '/admin/ai-integration',
      icon: Brain,
    },
    {
      title: 'IA para Mídia',
      url: '/admin/ai-media',
      icon: Image,
    },
    {
      title: 'Monitoramento IA',
      url: '/admin/ai-monitoring',
      icon: Activity,
    },
  ];

  const configurationItems = [
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

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
      <SidebarHeader className="border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-center">
          {(!isCollapsed || isMobile) ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Admin Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`flex items-center space-x-2 ${
                        isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integrations Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Integrações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {integrationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`flex items-center space-x-2 ${
                        isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business Management Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestão de Negócios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`flex items-center space-x-2 ${
                        isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Management Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Inteligência Artificial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`flex items-center space-x-2 ${
                        isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      className={`flex items-center space-x-2 ${
                        isActive(item.url) 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-sm min-w-0">
                <div className="font-medium text-gray-900 truncate">{user?.name || 'Admin'}</div>
                <div className="text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
