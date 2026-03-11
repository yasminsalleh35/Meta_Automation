
import React, { useState } from 'react';
import { Calendar, Clock, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignData } from '@/types/campaign';

interface DurationWizardStepProps {
  campaignData: CampaignData;
  updateCampaignData: (field: keyof CampaignData, value: any) => void;
}

export const DurationWizardStep: React.FC<DurationWizardStepProps> = ({
  campaignData,
  updateCampaignData
}) => {
  const [hasEndDate, setHasEndDate] = useState(!!campaignData.duration.endDate);

  const handleDurationChange = (field: string, value: string) => {
    updateCampaignData('duration', { 
      ...campaignData.duration, 
      [field]: value 
    });
  };

  const handleEndDateToggle = (enabled: boolean) => {
    setHasEndDate(enabled);
    if (!enabled) {
      handleDurationChange('endDate', '');
    }
  };

  const startDatePresets = [
    { 
      label: 'Hoje', 
      value: new Date().toISOString().split('T')[0],
      description: 'Começar imediatamente'
    },
    { 
      label: 'Amanhã', 
      value: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      })(),
      description: 'Começar amanhã'
    },
    { 
      label: 'Próxima semana', 
      value: (() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
      })(),
      description: 'Começar na próxima semana'
    }
  ];

  const calculateDays = () => {
    if (campaignData.duration.startDate && campaignData.duration.endDate) {
      const start = new Date(campaignData.duration.startDate);
      const end = new Date(campaignData.duration.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Quando você quer começar sua campanha?
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Escolha a data de início e defina se quer uma data final específica.
          </p>
        </div>
      </div>

      {/* Start Date Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {startDatePresets.map((preset) => (
          <Card 
            key={preset.value}
            className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md ${
              campaignData.duration.startDate === preset.value 
                ? 'border-purple-500 bg-purple-50 shadow-md' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => handleDurationChange('startDate', preset.value)}
          >
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl">📅</div>
                <h3 className="font-semibold text-gray-900">{preset.label}</h3>
                <p className="text-sm text-gray-600">{preset.description}</p>
                <p className="text-xs text-purple-600 font-medium">
                  {new Date(preset.value).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Start Date */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Ou escolha uma data específica</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="startDate" className="text-gray-700">Data de início da campanha</Label>
            <Input
              id="startDate"
              type="date"
              value={campaignData.duration.startDate}
              onChange={(e) => handleDurationChange('startDate', e.target.value)}
              min={today}
              className="text-lg font-medium border-2 focus:border-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* End Date Option */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Como você quer controlar o final da campanha?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Option 1: Optimized (Recommended) */}
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              !hasEndDate 
                ? 'border-camply-green bg-green-50 shadow-sm' 
                : 'border-gray-200 hover:border-camply-green/50'
            }`}
            onClick={() => handleEndDateToggle(false)}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                !hasEndDate ? 'border-camply-green bg-camply-green' : 'border-gray-300'
              }`}>
                {!hasEndDate && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">Deixar a Camply.ia otimizar</h3>
                  <span className="bg-camply-green/10 text-camply-green text-xs px-2 py-1 rounded-full font-medium border border-camply-green/20">
                    Recomendado
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  A campanha roda continuamente enquanto você monitora os resultados. 
                  Você pode pausar a qualquer momento quando atingir seus objetivos.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Fixed End Date */}
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              hasEndDate 
                ? 'border-camply-blue bg-blue-50 shadow-sm' 
                : 'border-gray-200 hover:border-camply-blue/50'
            }`}
            onClick={() => handleEndDateToggle(true)}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                hasEndDate ? 'border-camply-blue bg-camply-blue' : 'border-gray-300'
              }`}>
                {hasEndDate && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Definir data de término</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Escolha uma data específica para a campanha parar automaticamente.
                  Útil para promoções por tempo limitado.
                </p>
              </div>
            </div>

            {/* End Date Input (only shown when selected) */}
            {hasEndDate && (
              <div className="mt-4 pl-8">
                <Label htmlFor="endDate" className="text-gray-700">Data de término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignData.duration.endDate}
                  onChange={(e) => handleDurationChange('endDate', e.target.value)}
                  min={campaignData.duration.startDate || today}
                  className="max-w-xs border-2 focus:border-camply-blue"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duration Summary (only when end date is set) */}
      {hasEndDate && calculateDays() > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-camply-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-camply-blue" />
              <div>
                <p className="font-medium text-camply-blue">
                  Duração: {calculateDays()} dias
                </p>
                <p className="text-sm text-gray-600">
                  De {new Date(campaignData.duration.startDate).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(campaignData.duration.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-camply-blue">
                R$ {(calculateDays() * campaignData.budget.daily).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Investimento total</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Alert */}
      <Alert className="border-camply-green/20 bg-green-50">
        <Target className="h-4 w-4 text-camply-green" />
        <AlertDescription className="text-camply-green">
          <strong>Dica:</strong> Recomendamos deixar a Camply.ia otimizar o tempo da campanha. 
          Isso permite que a inteligência artificial aprenda e melhore os resultados continuamente, 
          parando apenas quando você decidir com base nos resultados obtidos.
        </AlertDescription>
      </Alert>
    </div>
  );
};
