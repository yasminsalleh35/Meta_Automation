import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CreditCard, Calendar, DollarSign } from 'lucide-react';
import UpdateCardForm from './UpdateCardForm';

interface Subscription {
  id: string;
  pagarme_subscription_id: string;
  subscription_status: string;
  is_active: boolean;
  current_period_end: string;
  canceled_at: string | null;
  plan_type: string;
  created_at: string;
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.pagarme_subscription_id) return;

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('pagarme-subscriptions-cancel', {
        body: {
          subscription_id: subscription.pagarme_subscription_id,
          at_period_end: true
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura será cancelada no final do período atual.",
      });

      await fetchSubscription();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar a assinatura.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.pagarme_subscription_id) return;

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('pagarme-subscriptions-reactivate', {
        body: {
          subscription_id: subscription.pagarme_subscription_id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura foi reativada com sucesso.",
      });

      await fetchSubscription();
    } catch (error: any) {
      toast({
        title: "Erro ao reativar",
        description: error.message || "Não foi possível reativar a assinatura.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'active' && isActive) {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    }
    if (status === 'canceled') {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    if (status === 'past_due') {
      return <Badge variant="secondary">Em atraso</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma assinatura encontrada</h2>
          <p className="text-gray-600 mb-6">
            Você ainda não possui uma assinatura ativa.
          </p>
          <Button onClick={() => navigate('/pricing')}>
            Ver Planos Disponíveis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minha Assinatura</h1>
          <p className="text-gray-600">Gerencie sua assinatura e forma de pagamento</p>
        </div>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Status da Assinatura</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Plano:</span>
              <span className="capitalize">{subscription.plan_type}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              {getStatusBadge(subscription.subscription_status, subscription.is_active)}
            </div>

            {subscription.current_period_end && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Próxima renovação:</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</span>
                </span>
              </div>
            )}

            {subscription.canceled_at && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Cancelada em:</span>
                <span>{new Date(subscription.canceled_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}

            <Separator />

            <div className="flex space-x-2">
              {subscription.subscription_status === 'active' && subscription.is_active ? (
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
                </Button>
              ) : (
                <Button 
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Reativando...' : 'Reativar Assinatura'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atualizar Cartão */}
        {subscription.is_active && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Forma de Pagamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateCardForm 
                subscriptionId={subscription.pagarme_subscription_id}
                onSuccess={fetchSubscription}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}