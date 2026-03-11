
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
  selectedRange: DateRange;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  onDateRangeChange,
  selectedRange
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('30');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  // Função para determinar qual filtro está ativo baseado no range selecionado
  const determineActiveFilter = (range: DateRange): string => {
    const today = new Date();
    const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
    
    // Verificar se é "hoje"
    const isToday = range.from.getDate() === today.getDate() && 
                   range.from.getMonth() === today.getMonth() && 
                   range.from.getFullYear() === today.getFullYear() &&
                   range.to.getDate() === today.getDate() && 
                   range.to.getMonth() === today.getMonth() && 
                   range.to.getFullYear() === today.getFullYear();
    
    if (isToday) return 'today';
    if (daysDiff <= 15) return '15';
    if (daysDiff <= 30) return '30';
    return 'custom';
  };

  // Sincronizar o filtro ativo quando o selectedRange mudar
  useEffect(() => {
    const newActiveFilter = determineActiveFilter(selectedRange);
    setActiveFilter(newActiveFilter);
  }, [selectedRange]);

  const handleQuickFilter = (days: string) => {
    setActiveFilter(days);
    const today = new Date();
    let from: Date;

    switch (days) {
      case 'today':
        from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case '15':
        from = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    onDateRangeChange({ from, to: today });
  };

  const handleCustomRange = () => {
    if (customRange.from && customRange.to) {
      setActiveFilter('custom');
      onDateRangeChange({ from: customRange.from, to: customRange.to });
      setIsCustomOpen(false);
    }
  };

  const quickFilters = [
    { key: 'today', label: 'Hoje' },
    { key: '15', label: '15 dias' },
    { key: '30', label: '30 dias' }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            {quickFilters.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickFilter(filter.key)}
                className={activeFilter === filter.key ? 'bg-blue-600 text-white' : ''}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activeFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  activeFilter === 'custom' && "bg-blue-600 text-white"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {activeFilter === 'custom' && customRange.from && customRange.to
                  ? `${format(customRange.from, 'dd/MM/yyyy')} - ${format(customRange.to, 'dd/MM/yyyy')}`
                  : 'Período específico'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data inicial
                    </label>
                    <Calendar
                      mode="single"
                      selected={customRange.from}
                      onSelect={(date) => setCustomRange(prev => ({ ...prev, from: date }))}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data final
                    </label>
                    <Calendar
                      mode="single"
                      selected={customRange.to}
                      onSelect={(date) => setCustomRange(prev => ({ ...prev, to: date }))}
                      disabled={(date) => !customRange.from || date < customRange.from}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCustomOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleCustomRange}
                    disabled={!customRange.from || !customRange.to}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Período selecionado: {format(selectedRange.from, 'dd/MM/yyyy')} até {format(selectedRange.to, 'dd/MM/yyyy')}
        </div>
      </CardContent>
    </Card>
  );
};
