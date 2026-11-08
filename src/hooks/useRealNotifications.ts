import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';
import { pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';

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

export interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  recent: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ADM-03: painel admin de notificações — paginado no servidor, estatísticas por contagem
// (não pelas linhas carregadas) e mutações que falham de forma visível. As policies
// notifications_admin_* permitem ao admin enviar / marcar / excluir notificações de qualquer usuário.
export const useRealNotifications = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, read: 0, unread: 0, recent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const supabase = useSupabase();
  const { toast } = useToast();

  const loadStats = useCallback(async () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const head = { count: 'exact' as const, head: true };
    const [total, unread, recent] = await Promise.all([
      supabase.from('notifications').select('id', head),
      supabase.from('notifications').select('id', head).eq('read', false),
      supabase.from('notifications').select('id', head).gt('created_at', dayAgo),
    ]);
    const t = total.count ?? 0;
    const u = unread.count ?? 0;
    setStats({ total: t, unread: u, read: Math.max(0, t - u), recent: recent.count ?? 0 });
  }, [supabase]);

  const loadNotifications = useCallback(async (nextPage: number = pageRef.current) => {
    try {
      setIsLoading(true);
      setError(null);
      const [from, to] = pageRange(nextPage, pageSize);
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
      setTotalCount(count ?? 0);
      setPage(nextPage);
      pageRef.current = nextPage;
      loadStats();
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, pageSize, loadStats]);

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      await loadNotifications(0);

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
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Sem permissão para alterar esta notificação');

      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      loadStats();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Sem permissão para excluir esta notificação');

      await loadNotifications();

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
    const validIds = [...new Set(userIds.map(id => id.trim()).filter(id => UUID_RE.test(id)))];
    if (validIds.length === 0) {
      toast({
        title: "Erro",
        description: "Informe ao menos um ID de usuário válido",
        variant: "destructive"
      });
      return false;
    }
    try {
      const notifications = validIds.map(userId => ({
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

      await loadNotifications(0);

      toast({
        title: "Sucesso",
        description: `Notificação enviada para ${validIds.length} usuário(s)`
      });
      return true;
    } catch (err) {
      console.error('Error sending bulk notification:', err);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificações",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    loadNotifications(0);

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
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase]);

  return {
    notifications,
    totalCount,
    page,
    pageSize,
    goToPage: (p: number) => loadNotifications(p),
    stats,
    isLoading,
    error,
    loadNotifications,
    createNotification,
    markAsRead,
    deleteNotification,
    sendBulkNotification
  };
};
