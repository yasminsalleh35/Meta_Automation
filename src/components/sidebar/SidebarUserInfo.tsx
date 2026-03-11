
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CamplyFlowAnimation } from './CamplyFlowAnimation';

export function SidebarUserInfo() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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

  // Verificação de segurança
  if (!user) {
    return null;
  }

  return (
    <SidebarFooter className="border-t border-gray-200 p-4 space-y-3">
      <CamplyFlowAnimation />

      <Button
        variant="ghost" 
        className={`w-full ${isCollapsed ? 'px-2' : 'justify-start'}`}
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        {!isCollapsed && <span className="ml-2">Sair</span>}
      </Button>
    </SidebarFooter>
  );
}
