
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  lastLogin: string;
  campaigns: number;
  spending: number;
  avatar?: string;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  amount: number;
  nextBilling: string | null;
  createdAt: string;
  paymentMethod: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  newUsersThisMonth: number;
  avgRevenuePerUser: number;
  topPlan: string;
  conversionRate: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export interface AdminActivity {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  type: 'user' | 'subscription' | 'system' | 'payment';
}
