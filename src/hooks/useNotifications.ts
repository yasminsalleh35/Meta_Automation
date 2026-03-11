
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notificationList = (data || []).map(item => ({
        ...item,
        type: item.type as 'info' | 'success' | 'warning' | 'error'
      }));
      
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Erro ao carregar notificações');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          read: false
        });

      if (error) throw error;
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      setError('Erro ao criar notificação');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Erro ao marcar como lida');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Erro ao excluir notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Erro ao marcar todas como lidas');
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription with error handling
    let channel: any = null;
    
    try {
      if (supabase && typeof supabase.channel === 'function') {
        channel = supabase
          .channel('notifications_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications'
            },
            (payload) => {
              console.log('Notification change:', payload);
              fetchNotifications();
            }
          )
          .subscribe();
      } else {
        console.warn('Realtime não disponível, usando polling como fallback');
        // Fallback: polling a cada 30 segundos
        const pollInterval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      // Fallback: polling a cada 30 segundos
      const pollInterval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(pollInterval);
    }

    return () => {
      if (channel && supabase && typeof supabase.removeChannel === 'function') {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    createNotification,
    markAsRead,
    deleteNotification,
    markAllAsRead
  };
};
