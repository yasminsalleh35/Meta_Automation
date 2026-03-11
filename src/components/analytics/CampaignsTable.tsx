
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePagination } from '@/hooks/analytics/usePagination';

interface CampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'finished';
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  createdAt: string;
}

interface CampaignsTableProps {
  data: CampaignData[];
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof CampaignData;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Configuração da paginação
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    totalItems,
    resetPage
  } = usePagination({
    data: data || [],
    itemsPerPage: 15
  });

  // Reset da página quando os dados mudarem
  useEffect(() => {
    resetPage();
  }, [data.length, resetPage]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercentage = (value: number) => 
    `${value.toFixed(2)}%`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'finished': return 'Finalizada';
      default: return status;
    }
  };

  const handleSort = (key: keyof CampaignData) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return paginatedData;

    return [...paginatedData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [paginatedData, sortConfig]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma campanha encontrada com os filtros aplicados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campanhas ({totalItems})</span>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabela com altura fixa e scroll interno */}
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Campanha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('spend')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Investimento
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('impressions')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Impressões
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('clicks')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Cliques
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('conversions')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Conversões
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('ctr')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        CTR
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('cpc')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        CPC
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('roas')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        ROAS
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={campaign.name}>
                          {campaign.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {campaign.objective}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(campaign.spend)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(campaign.impressions)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(campaign.clicks)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(campaign.conversions)}
                      </TableCell>
                      <TableCell>
                        <span className={campaign.ctr > 1 ? 'text-green-600 font-medium' : ''}>
                          {formatPercentage(campaign.ctr)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(campaign.cpc)}
                      </TableCell>
                      <TableCell>
                        <span className={campaign.roas > 2 ? 'text-green-600 font-medium' : campaign.roas < 1 ? 'text-red-600' : ''}>
                          {campaign.roas.toFixed(2)}x
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * 15) + 1} a {Math.min(currentPage * 15, totalItems)} de {totalItems} campanhas
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={!hasPreviousPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
