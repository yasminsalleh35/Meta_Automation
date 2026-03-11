
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminActions = () => {
  const { toast } = useToast();

  const suspendUser = async (userId: string) => {
    try {
      console.log('🚫 Suspending user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId);

      if (error) {
        console.error('❌ Suspend user error:', error);
        throw error;
      }
      
      toast({
        title: "Usuário suspenso",
        description: "Usuário foi suspenso com sucesso.",
      });
      
      console.log('✅ User suspended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error suspending user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível suspender o usuário.",
        variant: "destructive"
      });
      return false;
    }
  };

  const activateUser = async (userId: string) => {
    try {
      console.log('✅ Activating user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) {
        console.error('❌ Activate user error:', error);
        throw error;
      }
      
      toast({
        title: "Usuário ativado",
        description: "Usuário foi ativado com sucesso.",
      });
      
      console.log('✅ User activated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error activating user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar o usuário.",
        variant: "destructive"
      });
      return false;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      console.log('👁️ Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Mark notification error:', error);
        throw error;
      }
      
      console.log('✅ Notification marked as read successfully');
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
