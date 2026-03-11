import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Controller, UseFormReturn } from 'react-hook-form';
import { BarChart3, Info } from 'lucide-react';

interface StrategicReportsSectionProps {
  form: UseFormReturn<any>;
}

export const StrategicReportsSection: React.FC<StrategicReportsSectionProps> = ({
  form
}) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-orange-600" />
          Relatórios Estratégicos
        </CardTitle>
        <CardDescription className="text-lg">
          Configure preferências para geração de relatórios inteligentes e análises estratégicas personalizadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre os Relatórios Estratégicos</p>
              <p>
                Esta funcionalidade gera análises detalhadas do seu negócio, incluindo sugestões de público-alvo, 
                orçamento recomendado e estratégias de marketing personalizadas baseadas no seu setor e especialidades.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Switch 
              id="enable_reports"
              checked={true}
              disabled
            />
            <Label htmlFor="enable_reports" className="text-base font-medium">
              Habilitar relatórios estratégicos inteligentes
            </Label>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            Esta funcionalidade está habilitada para o perfil de campanha selecionado.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Observações Adicionais (Opcional)</Label>
          <Controller
            name="strategic_notes"
            control={form.control}
            render={({ field }) => (
              <>
                <Textarea
                  {...field}
                  placeholder="Descreva particularidades do seu negócio que devem ser consideradas nos relatórios..."
                  rows={4}
                  className="resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value?.length || 0} / 5000 caracteres
                </p>
              </>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: "Atendo principalmente crianças", "Foco em tratamentos estéticos", "Localização em bairro de classe A", etc.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};