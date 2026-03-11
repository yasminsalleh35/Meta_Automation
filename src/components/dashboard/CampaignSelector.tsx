import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  meta_campaign_id?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaign: string;
  onCampaignChange: (campaignId: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  campaigns,
  selectedCampaign,
  onCampaignChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isLoading = false
}) => {
  const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);

  const quickDateRanges = [
    {
      label: 'Últimos 7 dias',
      range: { from: subDays(new Date(), 7), to: new Date() }
    },
    {
      label: 'Últimos 30 dias',
      range: { from: subDays(new Date(), 30), to: new Date() }
    },
    {
      label: 'Últimos 90 dias',
      range: { from: subDays(new Date(), 90), to: new Date() }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Campaign Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Campanha</label>
            <Select value={selectedCampaign} onValueChange={onCampaignChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Campanhas</SelectItem>
                {campaignsWithMeta.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="space-y-2">
                    {quickDateRanges.map((range, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onDateRangeChange(range.range)}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onDateRangeChange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Refresh Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ações</label>
            <Button 
              onClick={onRefresh} 
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};