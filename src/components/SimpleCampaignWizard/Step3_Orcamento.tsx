
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';
import { cn } from '@/lib/utils';

interface Step3OrcamentoProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

export const Step3Orcamento: React.FC<Step3OrcamentoProps> = ({ formData, updateFormData }) => {
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFloat(e.target.value) || 0;
    updateFormData('dailyBudget', numericValue);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Orçamento e Data</CardTitle>
        <CardDescription className="text-center">
          Defina seu investimento e quando começar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="budget">Orçamento Diário</Label>
          <Input
            id="budget"
            type="number"
            min={30}
            placeholder="30"
            value={formData.dailyBudget}
            onChange={handleBudgetChange}
          />
          <p className="text-sm text-gray-600">
            Investimento mínimo recomendado: R$ 30,00/dia
          </p>
        </div>

        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? (
                  format(formData.startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && updateFormData('startDate', date)}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data de Término (Opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? (
                  format(formData.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Campanha contínua (sem data de fim)</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate || undefined}
                onSelect={(date) => updateFormData('endDate', date || null)}
                disabled={(date) => date <= (formData.startDate || new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {formData.endDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFormData('endDate', null)}
              className="text-xs text-muted-foreground"
            >
              Remover data de término (campanha contínua)
            </Button>
          )}
          <p className="text-sm text-gray-600">
            {formData.endDate
              ? 'A campanha será encerrada automaticamente nesta data.'
              : 'Sem data de término, a campanha roda continuamente até você pausar.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
