
import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useRealNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      await loadNotifications();
      
      toast({
        title: "Sucesso",
        description: "Notificação criada com sucesso"
      });
    } catch (err) {
      console.error('Error creating notification:', err);
      toast({
        title: "Erro",
        description: "Erro ao criar notificação",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      toast({
        title: "Sucesso",
        description: "Notificação excluída"
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: "Erro",
        description: "Erro ao excluir notificação",
        variant: "destructive"
      });
    }
  };

  const sendBulkNotification = async (userIds: string[], title: string, message: string, type: string = 'info') => {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      await loadNotifications();
      
      toast({
        title: "Sucesso",
        description: `Notificação enviada para ${userIds.length} usuário(s)`
      });
    } catch (err) {
      console.error('Error sending bulk notification:', err);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificações",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Admin notification change:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notifications,
    isLoading,
    error,
    loadNotifications,
    createNotification,
    markAsRead,
    deleteNotification,
    sendBulkNotification
  };
};
