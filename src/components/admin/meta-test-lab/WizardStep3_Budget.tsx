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
import { cn } from '@/lib/utils';
import { TestWizardFormData } from '@/types/testWizard.types';

interface WizardStep3BudgetProps {
  formData: TestWizardFormData;
  updateFormData: (field: keyof TestWizardFormData, value: any) => void;
}

export const WizardStep3_Budget: React.FC<WizardStep3BudgetProps> = ({ formData, updateFormData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Passo 3: Orçamento e Data</CardTitle>
        <CardDescription>Defina investimento e data de início</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dailyBudget">Orçamento Diário (R$)</Label>
          <Input
            id="dailyBudget"
            type="number"
            min={30}
            value={formData.dailyBudget}
            onChange={(e) => updateFormData('dailyBudget', parseFloat(e.target.value) || 0)}
            placeholder="30"
          />
          <p className="text-xs text-muted-foreground">
            Mínimo recomendado: R$ 30/dia
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
                selected={formData.startDate || undefined}
                onSelect={(date) => date && updateFormData('startDate', date)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            A campanha será contínua (sem data de fim)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
