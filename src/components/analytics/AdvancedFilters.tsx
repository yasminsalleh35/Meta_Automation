
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  campaigns: string[];
  status: string;
  objective: string;
  period: string;
}

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: Partial<AnalyticsFilters>) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const periodOptions = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '15d', label: 'Últimos 15 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Ativas' },
    { value: 'paused', label: 'Pausadas' },
    { value: 'finished', label: 'Finalizadas' }
  ];

  const objectiveOptions = [
    { value: 'all', label: 'Todos os objetivos' },
    { value: 'LEAD_GENERATION', label: 'Geração de Leads' },
    { value: 'TRAFFIC', label: 'Tráfego' },
    { value: 'CONVERSIONS', label: 'Conversões' },
    { value: 'REACH', label: 'Alcance' }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-camply-blue" />
            <span className="font-medium text-gray-900">Filtros Avançados</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Período */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Período
            </label>
            <Select
              value={filters.period}
              onValueChange={(value) => onFiltersChange({ period: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Personalizada */}
          {filters.period === 'custom' && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Intervalo de Datas
              </label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "dd/MM/yyyy")
                      ) : (
                        "Data inicial"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => 
                        date && onFiltersChange({ 
                          dateRange: { ...filters.dateRange, from: date }
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "dd/MM/yyyy")
                      ) : (
                        "Data final"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => 
                        date && onFiltersChange({ 
                          dateRange: { ...filters.dateRange, to: date }
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objetivo */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Objetivo
            </label>
            <Select
              value={filters.objective}
              onValueChange={(value) => onFiltersChange({ objective: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Objetivo" />
              </SelectTrigger>
              <SelectContent>
                {objectiveOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
