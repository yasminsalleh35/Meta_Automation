
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { SimpleCampaignListFilters as FiltersType } from '@/hooks/useSimpleCampaignList';

interface SimpleCampaignListFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export const SimpleCampaignListFilters: React.FC<SimpleCampaignListFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? '' : status as 'ACTIVE' | 'PAUSED' | 'REJECTED'
    });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFiltersChange({
      ...filters,
      dateFrom
    });
  };

  const handleDateToChange = (dateTo: string) => {
    onFiltersChange({
      ...filters,
      dateTo
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">🟢 Ativas</SelectItem>
            <SelectItem value="PAUSED">🟡 Pausadas</SelectItem>
            <SelectItem value="REJECTED">🔴 Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateFrom">Data inicial</Label>
        <Input
          id="dateFrom"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleDateFromChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateTo">Data final</Label>
        <Input
          id="dateTo"
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleDateToChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Limpar
        </Button>
      </div>
    </div>
  );
};
