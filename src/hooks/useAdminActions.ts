
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ADM-02: status changes go through the admin-only RPC. A direct profiles update hit 0 rows
// (no admin UPDATE policy) while the UI reported success.
const setUserStatus = async (userId: string, status: 'active' | 'suspended') => {
  const { error } = await supabase.rpc('admin_set_user_status' as any, { uid: userId, new_status: status });
  if (error) throw error;
};

const errorMessage = (error: unknown, fallback: string) => {
  const msg = (error as { message?: string })?.message;
  if (!msg) return fallback;
  if (msg === 'forbidden') return 'Você não tem permissão para esta ação.';
  return msg;
};

export const useAdminActions = () => {
  const { toast } = useToast();

  const suspendUser = async (userId: string) => {
    try {
      await setUserStatus(userId, 'suspended');
      toast({
        title: "Usuário suspenso",
        description: "Usuário foi suspenso com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('❌ Error suspending user:', error);
      toast({
        title: "Erro ao suspender usuário",
        description: errorMessage(error, "Não foi possível suspender o usuário."),
        variant: "destructive"
      });
      return false;
    }
  };

  const activateUser = async (userId: string) => {
    try {
      await setUserStatus(userId, 'active');
      toast({
        title: "Usuário ativado",
        description: "Usuário foi ativado com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('❌ Error activating user:', error);
      toast({
        title: "Erro ao ativar usuário",
        description: errorMessage(error, "Não foi possível ativar o usuário."),
        variant: "destructive"
      });
      return false;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Mark notification error:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  };

  return {
    suspendUser,
    activateUser,
    markNotificationAsRead
  };
};
