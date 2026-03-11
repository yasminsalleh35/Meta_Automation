
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Zap, 
  Target, 
  TrendingUp, 
  Shield,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionData {
  plan_name: string;
  plan_type: string;
  plan_limits: {
    campaigns: number;
    ai_requests: number;
    monthly_budget: number;
  };
  is_active: boolean;
}

interface UsageData {
  campaigns_used: number;
  ai_requests_used: number;
  monthly_budget_used: number;
}

interface SubscriptionSectionProps {
  subscription: SubscriptionData | null;
  usage: UsageData;
  loading?: boolean;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  subscription,
  usage,
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="border-gold-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4 text-center">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Ative seu plano</h3>
          <p className="text-sm text-gray-600 mb-4">
            Escolha um plano para começar a criar campanhas
          </p>
          <Link to="/subscription">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Ver Planos
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'premium':
      case 'pro':
        return Crown;
      case 'enterprise':
        return Shield;
      default:
        return Zap;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'premium':
      case 'pro':
        return 'from-purple-50 to-pink-50';
      case 'enterprise':
        return 'from-gray-50 to-slate-50';
      default:
        return 'from-blue-50 to-indigo-50';
    }
  };

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const PlanIcon = getPlanIcon(subscription.plan_type);

  return (
    <Card className={`border-0 bg-gradient-to-r ${getPlanColor(subscription.plan_type)} shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlanIcon className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-gray-900">
              Plano {subscription.plan_name}
            </span>
          </div>
          {subscription.is_active ? (
            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
          ) : (
            <Badge variant="outline">Inativo</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campanhas */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center">
              <Target className="w-4 h-4 mr-1 text-gray-600" />
              Campanhas
            </span>
            <span className="font-medium">
              {usage.campaigns_used} / {subscription.plan_limits.campaigns === -1 ? '∞' : subscription.plan_limits.campaigns}
            </span>
          </div>
          {subscription.plan_limits.campaigns !== -1 && (
            <Progress 
              value={calculateUsagePercentage(usage.campaigns_used, subscription.plan_limits.campaigns)} 
              className="h-2"
            />
          )}
        </div>

        {/* Requisições de IA */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-gray-600" />
              IA (mês)
            </span>
            <span className="font-medium">
              {usage.ai_requests_used} / {subscription.plan_limits.ai_requests === -1 ? '∞' : subscription.plan_limits.ai_requests}
            </span>
          </div>
          {subscription.plan_limits.ai_requests !== -1 && (
            <Progress 
              value={calculateUsagePercentage(usage.ai_requests_used, subscription.plan_limits.ai_requests)} 
              className="h-2"
            />
          )}
        </div>

        {/* Orçamento Mensal */}
        {subscription.plan_limits.monthly_budget && subscription.plan_limits.monthly_budget !== -1 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-gray-600" />
                Orçamento
              </span>
              <span className="font-medium">
                R$ {usage.monthly_budget_used} / R$ {subscription.plan_limits.monthly_budget}
              </span>
            </div>
            <Progress 
              value={calculateUsagePercentage(usage.monthly_budget_used, subscription.plan_limits.monthly_budget)} 
              className="h-2"
            />
          </div>
        )}

        {/* Botão de Upgrade */}
        <div className="pt-2 border-t border-white/20">
          <Link to="/subscription">
            <Button variant="outline" size="sm" className="w-full text-xs hover:bg-white/50">
              <Crown className="w-3 h-3 mr-2" />
              Gerenciar Plano
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
