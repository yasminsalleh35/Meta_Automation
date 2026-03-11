
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SimpleCampaignListEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhuma campanha encontrada
      </h3>
      <p className="text-gray-600 mb-6">
        Você ainda não criou nenhuma campanha com o Nova Campanha 2.0
      </p>
      <Button asChild className="flex items-center gap-2">
        <Link to="/dashboard/simple-campaign-wizard">
          <Plus className="w-4 h-4" />
          Criar primeira campanha
        </Link>
      </Button>
    </div>
  );
};
