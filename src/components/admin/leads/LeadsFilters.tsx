import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Lead, LeadsFilters as ILeadsFilters } from '@/hooks/admin/useLeads';

interface LeadsFiltersProps {
  filters: ILeadsFilters;
  onFiltersChange: (filters: ILeadsFilters) => void;
  leads: Lead[];
}

export const LeadsFilters: React.FC<LeadsFiltersProps> = ({
  filters,
  onFiltersChange,
  leads
}) => {
  const statusOptions = [
    { value: 'novo', label: 'Novo' },
    { value: 'contatado', label: 'Contatado' },
    { value: 'qualificado', label: 'Qualificado' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'perdido', label: 'Perdido' },
  ];

  const uniqueSpecialties = Array.from(
    new Set(
      leads.flatMap(lead => lead.specialties || (lead.specialty ? [lead.specialty] : []))
    )
  ).sort();

  const uniqueUtmSources = Array.from(
    new Set(leads.map(lead => lead.utm_source).filter(Boolean))
  ).sort();

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (typeof value !== 'object' || Object.keys(value).length > 0)
  );

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.specialty || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, specialty: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas especialidades</SelectItem>
            {uniqueSpecialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.utmSource || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, utmSource: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Origem (UTM)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {uniqueUtmSources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center text-sm text-muted-foreground">
          {leads.length} lead{leads.length !== 1 ? 's' : ''} encontrado{leads.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};