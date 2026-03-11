
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Filter,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'finished';
  objective: string;
  budget_daily: number;
  budget_total: number;
  created_at: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
}

interface CampaignListViewProps {
  campaigns: Campaign[];
  selectedCampaigns: Set<string>;
  onSelectCampaign: (campaignId: string) => void;
  onSelectAll: () => void;
  onActivate: (campaignId: string) => void;
  onPause: (campaignId: string) => void;
  onStop: (campaignId: string) => void;
  onEdit: (campaignId: string) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'status' | 'created_at' | 'budget_daily';
type SortDirection = 'asc' | 'desc';

export const CampaignListView: React.FC<CampaignListViewProps> = ({
  campaigns,
  selectedCampaigns,
  onSelectCampaign,
  onSelectAll,
  onActivate,
  onPause,
  onStop,
  onEdit,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausada</Badge>;
      case 'finished':
        return <Badge variant="destructive">Finalizada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const allSelected = campaigns.length > 0 && selectedCampaigns.size === campaigns.length;
  const someSelected = selectedCampaigns.size > 0 && selectedCampaigns.size < campaigns.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campanhas ({filteredAndSortedCampaigns.length})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header with bulk selection */}
        <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedCampaigns.size > 0 ? 
              `${selectedCampaigns.size} selecionada${selectedCampaigns.size > 1 ? 's' : ''}` : 
              'Selecionar todas'
            }
            {someSelected && ' (parcial)'}
          </span>
          
          {selectedCampaigns.size > 0 && (
            <div className="flex space-x-2 ml-auto">
              <Button size="sm" variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                <Play className="w-4 h-4 mr-1" />
                Ativar ({selectedCampaigns.size})
              </Button>
              <Button size="sm" variant="outline">
                <Pause className="w-4 h-4 mr-1" />
                Pausar ({selectedCampaigns.size})
              </Button>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm mb-2">
          <div className="col-span-1"></div>
          <div 
            className="col-span-4 flex items-center space-x-1 cursor-pointer hover:bg-gray-200 p-1 rounded"
            onClick={() => handleSort('name')}
          >
            <span>Nome</span>
            {getSortIcon('name')}
          </div>
          <div 
            className="col-span-2 flex items-center space-x-1 cursor-pointer hover:bg-gray-200 p-1 rounded"
            onClick={() => handleSort('status')}
          >
            <span>Status</span>
            {getSortIcon('status')}
          </div>
          <div 
            className="col-span-2 flex items-center space-x-1 cursor-pointer hover:bg-gray-200 p-1 rounded"
            onClick={() => handleSort('budget_daily')}
          >
            <span>Orçamento/dia</span>
            {getSortIcon('budget_daily')}
          </div>
          <div 
            className="col-span-2 flex items-center space-x-1 cursor-pointer hover:bg-gray-200 p-1 rounded"
            onClick={() => handleSort('created_at')}
          >
            <span>Criada em</span>
            {getSortIcon('created_at')}
          </div>
          <div className="col-span-1">Ações</div>
        </div>

        {/* Campaign Rows */}
        <div className="space-y-2">
          {filteredAndSortedCampaigns.map(campaign => (
            <div key={campaign.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={selectedCampaigns.has(campaign.id)}
                  onCheckedChange={() => onSelectCampaign(campaign.id)}
                />
              </div>
              
              <div className="col-span-4 flex items-center space-x-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{campaign.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {campaign.objective}
                  </div>
                </div>
                {campaign.meta_campaign_id && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Meta
                  </Badge>
                )}
              </div>
              
              <div className="col-span-2 flex items-center">
                {getStatusBadge(campaign.status)}
              </div>
              
              <div className="col-span-2 flex items-center">
                <span className="font-medium">R$ {campaign.budget_daily.toFixed(2)}</span>
              </div>
              
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-gray-600">
                  {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="col-span-1 flex items-center justify-end space-x-1">
                {campaign.status === 'paused' || campaign.status === 'draft' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActivate(campaign.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                ) : campaign.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPause(campaign.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : null}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(campaign.id)}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedCampaigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 
              'Nenhuma campanha encontrada com os termos de busca.' :
              'Nenhuma campanha encontrada.'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};
