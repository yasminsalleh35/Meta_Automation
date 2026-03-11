import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdminActions } from '@/hooks/useAdminActions';
import { AdminDataService } from '@/services/adminDataService';
import { AdminDataState, RealUser, RealNotification } from '@/types/adminData';

export const useRealAdminData = () => {
  const { toast } = useToast();
  const { suspendUser: suspendUserAction, activateUser: activateUserAction, markNotificationAsRead: markAsReadAction } = useAdminActions();
  
  const [state, setState] = useState<AdminDataState>({
    users: [],
    integrations: [],
    stats: null,
    notifications: [],
    activities: [],
    loading: true
  });

  const fetchRealData = async () => {
    try {
      console.log('🔄 Fetching real admin data...');
      setState(prev => ({ ...prev, loading: true }));
      
      // Fetch all data with improved error handling
      const [profiles, userPlans, campaignCounts, integrationsData, notificationsData] = await Promise.allSettled([
        AdminDataService.fetchProfiles(),
        AdminDataService.fetchSubscribers(),
        AdminDataService.fetchCampaignCounts(),
        AdminDataService.fetchIntegrations(),
        AdminDataService.fetchNotifications()
      ]);

      // Handle results with detailed logging
      let profilesResult = [];
      let userPlansResult = {};
      let campaignCountsResult = {};
      let integrationsResult = [];
      let notificationsResult = [];

      if (profiles.status === 'fulfilled') {
        profilesResult = profiles.value;
        console.log('✅ Profiles loaded:', profilesResult.length);
      } else {
        console.error('❌ Profiles fetch failed:', profiles.reason);
        toast({
          title: "Erro ao carregar usuários",
          description: profiles.reason?.message || "Não foi possível carregar a lista de usuários.",
          variant: "destructive"
        });
      }

      if (userPlans.status === 'fulfilled') {
        userPlansResult = userPlans.value;
        console.log('✅ User plans loaded:', Object.keys(userPlansResult).length);
      } else {
        console.warn('⚠️ Subscribers fetch failed:', userPlans.reason);
      }

      if (campaignCounts.status === 'fulfilled') {
        campaignCountsResult = campaignCounts.value;
        console.log('✅ Campaign counts loaded:', Object.keys(campaignCountsResult).length);
      } else {
        console.error('❌ Campaign counts fetch failed:', campaignCounts.reason);
      }

      if (integrationsData.status === 'fulfilled') {
        integrationsResult = integrationsData.value;
        console.log('✅ Integrations loaded:', integrationsResult.length);
      } else {
        console.error('❌ Integrations fetch failed:', integrationsData.reason);
      }

      if (notificationsData.status === 'fulfilled') {
        notificationsResult = notificationsData.value;
        console.log('✅ Notifications loaded:', notificationsResult.length);
      } else {
        console.error('❌ Notifications fetch failed:', notificationsData.reason);
      }

      // Transform data even if some parts failed
      const transformedUsers = AdminDataService.transformUsers(profilesResult, userPlansResult, campaignCountsResult);
      const realStats = AdminDataService.calculateStats(transformedUsers);
      const transformedNotifications = AdminDataService.transformNotifications(notificationsResult);
      const recentActivities = AdminDataService.generateActivities(transformedUsers, integrationsResult);

      setState({
        users: transformedUsers,
        integrations: integrationsResult,
        stats: realStats,
        notifications: transformedNotifications,
        activities: recentActivities,
        loading: false
      });

      console.log('✅ Real admin data loaded successfully');
      console.log('📊 Data summary:', {
        users: transformedUsers.length,
        integrations: integrationsResult.length,
        notifications: transformedNotifications.length,
        activities: recentActivities.length
      });

    } catch (error) {
      console.error('❌ Error loading real admin data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados administrativos.",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const suspendUser = async (userId: string) => {
    const success = await suspendUserAction(userId);
    if (success) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, status: 'suspended' as const } : user
        )
      }));
    }
  };

  const activateUser = async (userId: string) => {
    const success = await activateUserAction(userId);
    if (success) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, status: 'active' as const } : user
        )
      }));
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const success = await markAsReadAction(notificationId);
    if (success) {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      }));
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  return {
    ...state,
    actions: {
      suspendUser,
      activateUser,
      markNotificationAsRead,
      refetchData: fetchRealData
    }
  };
};
