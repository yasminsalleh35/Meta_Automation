
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, AlertCircle } from 'lucide-react';
import type { LiveCampaign } from '@/types/liveCampaign';

interface CampaignHeaderProps {
  campaigns: LiveCampaign[];
  isError?: boolean;
  onRetry?: () => void;
}

export const CampaignHeader: React.FC<CampaignHeaderProps> = ({
  campaigns,
  isError = false,
  onRetry
}) => {
  if (isError) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent">
                  Erro ao Carregar
                </h1>
                <p className="text-red-100 text-lg">Não foi possível carregar suas campanhas</p>
              </div>
            </div>
          </div>
          {onRetry && (
            <Button onClick={onRetry} className="bg-white text-red-700 hover:bg-red-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3">
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
      <div className="relative z-10 flex justify-between items-center">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Campanhas
              </h1>
              <p className="text-blue-100 text-lg">Gerencie todas as suas campanhas com métricas em tempo real</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>{campaigns.filter(c => c.status === 'active').length} Ativas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>{campaigns.filter(c => c.status === 'paused').length} Pausadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span>{campaigns.filter(c => c.status === 'draft').length} Rascunhos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span>{campaigns.length} Meta Ads Live</span>
            </div>
          </div>
        </div>
        <Link to="/dashboard/campaigns/create">
          <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3">
            <Plus className="w-5 h-5 mr-2" />
            Nova Campanha
          </Button>
        </Link>
      </div>
    </div>
  );
};
