
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileCampaignFiltersProps {
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (status: string) => void;
  totalCount: number;
  filteredCount: number;
}

export const MobileCampaignFilters: React.FC<MobileCampaignFiltersProps> = ({
  searchTerm,
  filterStatus,
  onSearchChange,
  onFilterChange,
  totalCount,
  filteredCount
}) => {
  const statusOptions = [
    { value: 'all', label: 'Todas', count: totalCount },
    { value: 'active', label: 'Ativas', count: 0 },
    { value: 'paused', label: 'Pausadas', count: 0 },
    { value: 'draft', label: 'Rascunhos', count: 0 },
    { value: 'finished', label: 'Finalizadas', count: 0 }
  ];

  const clearFilters = () => {
    onSearchChange('');
    onFilterChange('all');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar campanhas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchTerm && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-blue-500 text-white text-xs h-5 w-5 p-0 rounded-full flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>Filtros de Campanha</SheetTitle>
                <SheetDescription>
                  Filtre suas campanhas por status
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filterStatus === option.value ? "default" : "outline"}
                        onClick={() => onFilterChange(option.value)}
                        className="justify-start h-12"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{option.label}</span>
                          <span className="text-xs opacity-70">{option.count} campanhas</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {filterStatus !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {statusOptions.find(opt => opt.value === filterStatus)?.label}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterChange('all')}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {filteredCount} de {totalCount}
        </div>
      </div>
    </div>
  );
};
