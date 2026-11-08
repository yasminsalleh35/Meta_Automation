
export interface RealUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  status: 'active' | 'suspended' | 'inactive';
  lastLogin: string;
  campaigns: number;
  // ADM-01: no longer estimated (was campaigns × 50). Not tracked per user yet → always 0.
  spending: number;
  role?: string;
  plan: 'basic' | 'premium' | 'enterprise';
}

export interface RealIntegration {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  created_at: string;
}

export interface RealStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  newUsersThisMonth: number;
  avgRevenuePerUser: number;
  topPlan: string;
  conversionRate: number;
  // ADM-01: extra figures returned by admin_dashboard_stats()
  activeByProvider?: Record<string, number>;
  mrrByProvider?: Record<string, number>;
  canceledLast30Days?: number;
  suspendedUsers?: number;
  campaignsTotal?: number;
  campaignsByStatus?: Record<string, number>;
  // false when the RPC failed and the numbers are a partial fallback
  fromServer?: boolean;
}

export interface RealNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  user_id: string;
}

export interface RealActivity {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  type: 'user' | 'subscription' | 'campaign' | 'integration';
}

export interface AdminDataState {
  users: RealUser[];
  integrations: RealIntegration[];
  stats: RealStats | null;
  notifications: RealNotification[];
  activities: RealActivity[];
  loading: boolean;
}
