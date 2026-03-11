
import { LucideIcon } from 'lucide-react';

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  limits: {
    campaigns: number;
    monthlyBudget: number;
    aiSuggestions: number;
    campaignAnalysis: number; // Nova limitação
  };
  popular?: boolean;
  icon: LucideIcon;
}

export type BillingPeriod = 'monthly' | 'annual';
