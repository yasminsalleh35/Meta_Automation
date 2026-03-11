
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Sparkles } from 'lucide-react';
import { Plan } from '@/types/subscription';
import { AuthUser } from '@/contexts/AuthContext';

interface PlanCardProps {
  plan: Plan;
  user: AuthUser | null;
  isLoading: boolean;
  onUpgrade: (planId: string) => void;
  onManageSubscription: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  user,
  isLoading,
  onUpgrade,
  onManageSubscription
}) => {
  const isCurrentPlan = plan.id === user?.subscription?.plan;
  const PlanIcon = plan.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getCardClasses = () => {
    if (plan.popular) {
      return 'relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 shadow-2xl transform hover:scale-105 transition-all duration-500 hover:shadow-blue-500/25';
    }
    if (isCurrentPlan) {
      return 'relative bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 shadow-xl transform hover:scale-105 transition-all duration-300';
    }
    return 'relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600';
  };

  const getIconClasses = () => {
    if (plan.popular) {
      return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg';
    }
    if (isCurrentPlan) {
      return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg';
    }
    return 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300';
  };

  const getButtonClasses = () => {
    if (plan.popular) {
      return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300';
    }
    return 'bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 hover:from-slate-900 hover:to-black text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300';
  };

  return (
    <Card className={getCardClasses()}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-lg animate-pulse">
            <Star className="w-4 h-4 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
            <Check className="w-4 h-4 mr-1" />
            Plano Atual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-6 pt-8">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${getIconClasses()} transition-all duration-300`}>
            <PlanIcon className="w-8 h-8" />
          </div>
        </div>
        
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {plan.name}
        </CardTitle>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-4xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {formatPrice(plan.price)}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              /{plan.period}
            </span>
          </div>
          {plan.period === 'ano' && (
            <div className="flex items-center justify-center space-x-1">
              <Sparkles className="w-4 h-4 text-green-500" />
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPrice(plan.price / 12)} por mês
              </p>
              <Sparkles className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
        
        <CardDescription className="mt-4 text-slate-600 dark:text-slate-300 font-medium">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start space-x-3 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-6 space-y-3">
          {isCurrentPlan ? (
            <div className="space-y-3">
              <Button disabled className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Check className="w-5 h-5 mr-2" />
                Plano Atual
              </Button>
              {user?.subscription?.active && (
                <Button 
                  variant="outline"
                  className="w-full h-10 text-sm font-medium border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
                  onClick={onManageSubscription}
                >
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          ) : (
            <Button 
              className={`w-full h-12 text-base font-semibold ${getButtonClasses()}`}
              onClick={() => onUpgrade(plan.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                'Escolher Plano'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
