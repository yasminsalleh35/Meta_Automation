
import { useState, useEffect } from 'react';
import { AdminUser, AdminSubscription, AdminStats, AdminNotification, AdminActivity } from '@/types/admin';

export const useAdminData = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data generation - em produção viria de APIs reais
  useEffect(() => {
    const generateMockData = () => {
      // Gerar usuários mock
      const mockUsers: AdminUser[] = Array.from({ length: 50 }, (_, i) => ({
        id: `user_${i + 1}`,
        name: `Usuário ${i + 1}`,
        email: `usuario${i + 1}@empresa.com`,
        plan: ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)] as any,
        status: ['active', 'suspended', 'inactive'][Math.floor(Math.random() * 3)] as any,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        campaigns: Math.floor(Math.random() * 20),
        spending: Math.floor(Math.random() * 5000)
      }));

      // Gerar assinaturas mock
      const mockSubscriptions: AdminSubscription[] = mockUsers
        .filter(user => user.status === 'active')
        .map((user, i) => ({
          id: `sub_${i + 1}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          plan: user.plan,
          status: 'active',
          amount: user.plan === 'basic' ? 29.99 : user.plan === 'premium' ? 99.99 : 299.99,
          nextBilling: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: user.createdAt,
          paymentMethod: ['Cartão de Crédito', 'PIX', 'Boleto'][Math.floor(Math.random() * 3)],
          billingCycle: Math.random() > 0.5 ? 'monthly' : 'yearly'
        }));

      // Gerar estatísticas
      const activeUsers = mockUsers.filter(u => u.status === 'active').length;
      const totalRevenue = mockSubscriptions.reduce((sum, s) => sum + s.amount, 0);
      
      const mockStats: AdminStats = {
        totalUsers: mockUsers.length,
        activeSubscriptions: mockSubscriptions.length,
        monthlyRevenue: totalRevenue,
        churnRate: 3.2,
        newUsersThisMonth: Math.floor(mockUsers.length * 0.15),
        avgRevenuePerUser: totalRevenue / activeUsers,
        topPlan: 'premium',
        conversionRate: 75.8
      };

      // Gerar notificações
      const mockNotifications: AdminNotification[] = [
        {
          id: 'notif_1',
          title: 'Novo usuário Premium',
          message: 'João Silva fez upgrade para Premium',
          type: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false
        },
        {
          id: 'notif_2',
          title: 'Pagamento em atraso',
          message: 'Maria Santos tem pagamento pendente',
          type: 'warning',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: false
        }
      ];

      // Gerar atividades
      const mockActivities: AdminActivity[] = [
        {
          id: 'act_1',
          action: 'Novo usuário registrado',
          user: 'Carlos Silva',
          details: 'Plano Basic selecionado',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          type: 'user'
        },
        {
          id: 'act_2',
          action: 'Assinatura cancelada',
          user: 'Ana Costa',
          details: 'Cancelamento solicitado pelo usuário',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          type: 'subscription'
        }
      ];

      setUsers(mockUsers);
      setSubscriptions(mockSubscriptions);
      setStats(mockStats);
      setNotifications(mockNotifications);
      setActivities(mockActivities);
      setLoading(false);
    };

    setTimeout(generateMockData, 1000); // Simular loading
  }, []);

  const suspendUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: 'suspended' } : user
    ));
    
    // Adicionar atividade
    const user = users.find(u => u.id === userId);
    if (user) {
      setActivities(prev => [{
        id: `act_${Date.now()}`,
        action: 'Usuário suspenso',
        user: user.name,
        details: 'Suspenso pelo administrador',
        timestamp: new Date().toISOString(),
        type: 'user'
      }, ...prev]);
    }
  };

  const activateUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: 'active' } : user
    ));
  };

  const cancelSubscription = (subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId ? { ...sub, status: 'cancelled', nextBilling: null } : sub
    ));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  return {
    users,
    subscriptions,
    stats,
    notifications,
    activities,
    loading,
    actions: {
      suspendUser,
      activateUser,
      cancelSubscription,
      markNotificationAsRead
    }
  };
};
