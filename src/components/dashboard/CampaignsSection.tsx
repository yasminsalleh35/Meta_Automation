
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Play, 
  Pause, 
  Edit, 
  Eye, 
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResponsive } from '@/hooks/useResponsive';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'finished';
  created_at: string;
  budget_daily: number;
  objective: string;
  meta_campaign_id?: string;
}

interface CampaignsSectionProps {
  campaigns: Campaign[];
  metrics: any;
  onToggleCampaign?: (id: string, status: string) => void;
}

export const CampaignsSection: React.FC<CampaignsSectionProps> = ({
  campaigns,
  metrics,
  onToggleCampaign
}) => {
  const { isMobile } = useResponsive();
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case 'finished':
        return <Badge className="bg-gray-100 text-gray-800">Finalizada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const calculateCampaignMetrics = (campaign: Campaign) => {
    // Estimativas baseadas no orçamento e métricas gerais
    const dailyBudget = parseFloat(String(campaign.budget_daily)) || 0;
    const estimatedLeads = Math.round(dailyBudget * 0.4); // Estimativa
    const estimatedCPL = estimatedLeads > 0 ? dailyBudget / estimatedLeads : 0;
    
    return {
      leads: estimatedLeads,
      cpl: estimatedCPL,
      budget: dailyBudget
    };
  };

  if (activeCampaigns.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" />
            Minhas Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma campanha ativa
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando sua primeira campanha para gerar leads
            </p>
            <Link to="/dashboard/campaigns/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Target className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" />
            Minhas Campanhas ({activeCampaigns.length})
          </CardTitle>
          <Link to="/dashboard/campaigns">
            <Button variant="outline" className="w-full sm:w-auto hover:bg-purple-50 hover:border-purple-200">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={4} className="sm:gap-6">
          {activeCampaigns.map((campaign) => {
            const campaignMetrics = calculateCampaignMetrics(campaign);
            
            return (
              <div 
                key={campaign.id}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200"
              >
                {/* Header da Campanha */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                        {campaign.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(campaign.status)}
                        {campaign.meta_campaign_id && (
                          <Badge variant="outline" className="text-xs">
                            Meta Ads
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Preview */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Preview do anúncio</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Objetivo: {campaign.objective}
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-bold text-green-600">
                      {campaignMetrics.leads}
                    </div>
                    <div className="text-xs text-gray-500">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-bold text-blue-600">
                      R$ {campaignMetrics.cpl.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">CPL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-bold text-purple-600">
                      R$ {campaignMetrics.budget}
                    </div>
                    <div className="text-xs text-gray-500">Diário</div>
                  </div>
                </div>

                {/* Data */}
                <div className="flex items-center space-x-2 mb-4 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Ações */}
                <div className="flex items-center space-x-2">
                  <Link to={`/dashboard/campaigns/${campaign.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Detalhes
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onToggleCampaign?.(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                    className="text-xs"
                  >
                    {campaign.status === 'active' ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                  <Link to={`/dashboard/campaigns/${campaign.id}/edit`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </ResponsiveGrid>
      </CardContent>
    </Card>
  );
};
