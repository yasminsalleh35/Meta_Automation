import { supabase } from '@/integrations/supabase/client';
import { RealUser, RealIntegration, RealStats, RealNotification, RealActivity } from '@/types/adminData';

export class AdminDataService {
  static async fetchProfiles() {
    console.log('🔄 Fetching profiles...');
    try {
      // Usar função administrativa segura para buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_profiles_admin_safe');

      if (profilesError) {
        console.error('Profiles error details:', {
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          code: profilesError.code
        });
        throw profilesError;
      }

      // Se profiles funcionou, agora tentamos buscar user_roles separadamente
      let profilesWithRoles = profiles || [];
      
      try {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.warn('User roles fetch failed, continuing without roles:', rolesError);
        } else {
          // Mapear roles para os profiles
          const rolesMap = new Map(userRoles?.map(role => [role.user_id, role.role]) || []);
          profilesWithRoles = profiles?.map(profile => ({
            ...profile,
            user_roles: rolesMap.has(profile.id) ? [{ role: rolesMap.get(profile.id) }] : []
          })) || [];
        }
      } catch (rolesErr) {
        console.warn('Failed to fetch user roles, profiles will not have role information:', rolesErr);
      }

      console.log('✅ Profiles fetched successfully:', profilesWithRoles?.length || 0);
      return profilesWithRoles;
    } catch (error) {
      console.error('❌ Fetch profiles failed:', error);
      throw error;
    }
  }

  static async fetchSubscribers() {
    console.log('🔄 Fetching subscribers...');
    try {
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, plan_type');

      if (subscribersError) {
        console.error('Subscribers error:', subscribersError);
        // Don't throw, just log as this might not be critical
        return {};
      }

      // Create a map of user_id to plan_type
      const userPlans: Record<string, string> = {};
      subscribers?.forEach(sub => {
        if (sub.user_id && sub.plan_type) {
          userPlans[sub.user_id] = sub.plan_type;
        }
      });

      console.log('✅ Subscribers fetched:', Object.keys(userPlans).length);
      return userPlans;
    } catch (error) {
      console.error('❌ Fetch subscribers failed:', error);
      return {};
    }
  }

  static async fetchCampaignCounts() {
    console.log('🔄 Fetching campaign counts...');
    try {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('user_id');

      if (campaignError) {
        console.error('Campaign error:', campaignError);
        throw campaignError;
      }

      const counts: Record<string, number> = {};
      campaigns?.forEach(campaign => {
        counts[campaign.user_id] = (counts[campaign.user_id] || 0) + 1;
      });

      console.log('✅ Campaign counts calculated:', Object.keys(counts).length, 'users');
      return counts;
    } catch (error) {
      console.error('❌ Fetch campaign counts failed:', error);
      throw error;
    }
  }

  static async fetchIntegrations() {
    console.log('🔄 Fetching integrations...');
    try {
      // Usar função administrativa segura que mascara tokens sensíveis
      const { data: integrationsData, error: integrationsError } = await supabase
        .rpc('get_integrations_admin_safe');

      if (integrationsError) {
        console.error('Integrations error:', integrationsError);
        throw integrationsError;
      }

      console.log('✅ Integrations fetched:', integrationsData?.length || 0);
      return integrationsData || [];
    } catch (error) {
      console.error('❌ Fetch integrations failed:', error);
      throw error;
    }
  }

  static async fetchNotifications() {
    console.log('🔄 Fetching notifications...');
    try {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) {
        console.error('Notifications error:', notificationsError);
        throw notificationsError;
      }

      console.log('✅ Notifications fetched:', notificationsData?.length || 0);
      return notificationsData || [];
    } catch (error) {
      console.error('❌ Fetch notifications failed:', error);
      throw error;
    }
  }

  static transformUsers(profiles: any[], userPlans: Record<string, string>, campaignCounts: Record<string, number>): RealUser[] {
    console.log('🔄 Transforming users...', {
      profilesCount: profiles.length,
      userPlansCount: Object.keys(userPlans).length,
      campaignCountsUsers: Object.keys(campaignCounts).length
    });

    return profiles.map(profile => {
      // Handle user_roles array - it might be empty or undefined
      let userRole = 'user';
      if (Array.isArray(profile.user_roles) && profile.user_roles.length > 0) {
        userRole = profile.user_roles[0].role;
      } else {
        console.log('⚠️ No role found for user:', profile.id, 'defaulting to "user"');
      }

      const campaignCount = campaignCounts[profile.id] || 0;
      
      // Determine plan type based on subscription or default to basic
      const planType = userPlans[profile.id] || 'basic';
      const plan = ['basic', 'premium', 'enterprise'].includes(planType) 
        ? planType as 'basic' | 'premium' | 'enterprise'
        : 'basic';
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        created_at: profile.created_at || new Date().toISOString(),
        status: (profile.status as 'active' | 'suspended' | 'inactive') || 'active',
        lastLogin: profile.last_login_at || new Date().toISOString(),
        campaigns: campaignCount,
        spending: campaignCount * 50, // Estimate based on campaigns
        role: userRole,
        plan: plan
      };
    });
  }

  static calculateStats(users: RealUser[]): RealStats {
    console.log('🔄 Calculating stats for', users.length, 'users');
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalSpending = users.reduce((sum, u) => sum + u.spending, 0);
    const newUsersThisMonth = users.filter(u => {
      const createdAt = new Date(u.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;

    const stats = {
      totalUsers,
      activeSubscriptions: activeUsers,
      monthlyRevenue: totalSpending,
      churnRate: totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0,
      newUsersThisMonth,
      avgRevenuePerUser: activeUsers > 0 ? totalSpending / activeUsers : 0,
      topPlan: 'basic',
      conversionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    };

    console.log('✅ Stats calculated:', stats);
    return stats;
  }

  static transformNotifications(notificationsData: any[]): RealNotification[] {
    return notificationsData.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type as 'info' | 'success' | 'warning' | 'error',
      timestamp: notification.created_at,
      read: notification.read,
      user_id: notification.user_id
    }));
  }

  static generateActivities(users: RealUser[], integrations: RealIntegration[]): RealActivity[] {
    const activities = [
      ...users.slice(0, 3).map(user => ({
        id: `act_${user.id}`,
        action: 'Usuário registrado',
        user: user.name,
        details: `Novo usuário criado: ${user.email}`,
        timestamp: user.created_at,
        type: 'user' as const
      })),
      ...integrations.slice(0, 2).map(integration => ({
        id: `act_int_${integration.id}`,
        action: 'Integração configurada',
        user: users.find(u => u.id === integration.user_id)?.name || 'Usuário',
        details: `${integration.provider} integrado`,
        timestamp: integration.created_at,
        type: 'integration' as const
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('✅ Activities generated:', activities.length);
    return activities;
  }
}
