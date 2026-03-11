
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface CampaignFiltersProps {
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

export const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  searchTerm,
  filterStatus,
  onSearchChange,
  onFilterChange
}) => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 border-0 shadow-md focus:shadow-lg transition-shadow duration-300"
            />
          </div>
          <Select value={filterStatus} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-56 h-12 border-0 shadow-md focus:shadow-lg transition-shadow duration-300">
              <Filter className="w-5 h-5 mr-2 text-gray-500" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="finished">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
