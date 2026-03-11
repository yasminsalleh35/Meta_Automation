
export interface RealUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  status: 'active' | 'suspended' | 'inactive';
  lastLogin: string;
  campaigns: number;
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
