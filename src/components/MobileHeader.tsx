
import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Shield, Bell, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotifications } from '@/hooks/useNotifications';
import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  title?: string;
  showUserMenu?: boolean;
}

// Função para obter o título da página baseado na rota
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/campaigns': 'Campanhas',
    '/dashboard/my-business': 'Meu Negócio',
    '/dashboard/tutorials': 'Tutoriais',
    '/dashboard/guides': 'Guias',
    '/dashboard/support': 'Suporte',
    '/dashboard/media': 'Criativos',
    '/dashboard/integrations': 'Integrações',
    '/dashboard/notifications': 'Notificações',
    '/dashboard/settings': 'Configurações',
    '/dashboard/subscription': 'Assinatura',
    '/dashboard/advanced-analytics': 'Analytics Avançado',
    '/dashboard/strategy-report': 'Relatórios',
    '/dashboard/simple-campaign-wizard': 'Nova Campanha',
    '/integrations': 'Integrações',
    '/business': 'Meu Negócio',
    '/settings': 'Configurações',
    '/support': 'Suporte',
    '/admin': 'Painel Admin',
    '/admin/users': 'Usuários',
    '/admin/campaigns': 'Campanhas',
    '/admin/meta-ads': 'Meta Ads',
    '/admin/sectors': 'Setores',
    '/learning': 'Aprendizagem',
    '/notifications': 'Notificações'
  };

  // Verificar rotas exatas primeiro
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Verificar rotas que começam com padrões específicos
  if (pathname.startsWith('/campaigns/')) {
    if (pathname.includes('/edit')) return 'Editar Campanha';
    if (pathname.match(/\/campaigns\/[^/]+$/)) return 'Detalhes da Campanha';
  }

  if (pathname.startsWith('/admin/')) {
    return 'Painel Admin';
  }

  return 'Camply';
};

export function MobileHeader({ title, showUserMenu = true }: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { unreadCount } = useNotifications();

  // Usar o título fornecido ou detectar automaticamente baseado na rota
  const pageTitle = title || getPageTitle(location.pathname);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/auth/login');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar o logout.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden safe-area-inset-top">
      <div className="container flex h-16 items-center px-4 safe-area-inset-x">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <SidebarTrigger className="flex-shrink-0 h-10 w-10 touch-target" />
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply" 
              className="h-7 w-auto flex-shrink-0"
            />
            <h1 className="text-lg font-semibold truncate max-w-[200px]">{pageTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Notificações */}
          <Button variant="ghost" size="sm" asChild className="relative h-10 w-10 p-0 touch-target">
            <Link to="/dashboard/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-[20px]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Admin Panel - Only for admins */}
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="h-10 w-10 p-0 touch-target">
              <Link to="/admin">
                <Shield className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {/* User Menu */}
          {showUserMenu && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative touch-target">
                  <User className="h-5 w-5" />
                  {isAdmin && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 bg-blue-500"
                    >
                      <span className="sr-only">Admin</span>
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-background border shadow-lg z-50 safe-area-inset-bottom"
                sideOffset={8}
              >
                <div className="flex items-center justify-start gap-3 p-4">
                  <div className="flex flex-col space-y-1 leading-none min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{user.name || 'Usuário'}</p>
                      {isAdmin && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="touch-target">
                  <Link to="/dashboard/settings" className="flex items-center w-full p-3">
                    <Settings className="mr-3 h-5 w-5" />
                    <span className="text-base">Configurações</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="touch-target">
                      <Link to="/admin" className="flex items-center w-full p-3">
                        <Shield className="mr-3 h-5 w-5" />
                        <span className="text-base">Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="touch-target p-3">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
