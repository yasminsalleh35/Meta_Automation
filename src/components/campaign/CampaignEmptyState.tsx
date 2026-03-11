
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface CampaignEmptyStateProps {
  hasAnyCampaigns: boolean;
}

export const CampaignEmptyState: React.FC<CampaignEmptyStateProps> = ({
  hasAnyCampaigns
}) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="py-20 text-center">
        <div className="text-gray-300 mb-6">
          <Search className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {!hasAnyCampaigns ? 'Nenhuma campanha criada' : 'Nenhuma campanha encontrada'}
        </h3>
        <p className="text-gray-600 mb-8 text-lg">
          {!hasAnyCampaigns 
            ? 'Crie sua primeira campanha para começar.'
            : 'Ajuste os filtros ou crie uma nova campanha.'
          }
        </p>
        <Link to="/dashboard/campaigns/create">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-3">
            <Plus className="w-5 h-5 mr-2" />
            {!hasAnyCampaigns ? 'Criar primeira campanha' : 'Criar nova campanha'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
