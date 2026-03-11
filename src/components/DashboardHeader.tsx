
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';

import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { useUserRole } from '@/hooks/useUserRole';

export function DashboardHeader() {
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('header.logout.success'),
        description: t('header.logout.success.description'),
      });
      navigate('/auth/login');
    } catch (error) {
      toast({
        title: t('header.logout.error'),
        description: t('header.logout.error.description'),
        variant: "destructive"
      });
    }
  };

  // Verificações de segurança
  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:flex">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <SidebarTrigger />
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" asChild className="relative">
            <Link to="/dashboard/notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                <span className="sr-only">Painel Admin</span>
              </Link>
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <User className="h-4 w-4" />
                {isAdmin && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full p-0 bg-blue-500"
                  >
                    <span className="sr-only">Admin</span>
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {user.name || user.email?.split('@')[0] || t('header.user')}
                    </p>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('header.settings')}
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Painel Admin
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
