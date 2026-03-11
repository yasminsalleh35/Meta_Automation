import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface StepMarketingProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const platforms = [
  { id: 'meta', label: 'Meta (Facebook/Instagram)' },
  { id: 'google', label: 'Google Ads' },
  { id: 'tiktok', label: 'TikTok Ads' },
  { id: 'youtube', label: 'YouTube Ads' },
  { id: 'linkedin', label: 'LinkedIn Ads' },
  { id: 'other', label: 'Outras plataformas' },
];

const results = [
  'Gerou bons resultados',
  'Resultados medianos',
  'Não trouxe os resultados esperados',
  'Difícil mensurar os resultados',
  'Gastei muito sem retorno',
  'Parei por falta de tempo',
];

const expectations = [
  'Aumentar o número de consultas',
  'Fortalecer a marca da clínica',
  'Lançar um novo serviço',
  'Competir melhor no mercado local',
  'Atrair pacientes de maior valor',
  'Diversificar tipos de tratamento',
];

export const StepMarketing: React.FC<StepMarketingProps> = ({ data, updateData }) => {
  const togglePlatform = (platformId: string) => {
    const currentPlatforms = data.platforms || [];
    const newPlatforms = currentPlatforms.includes(platformId)
      ? currentPlatforms.filter((p: string) => p !== platformId)
      : [...currentPlatforms, platformId];
    updateData('platforms', newPlatforms);
  };

  const showPlatformQuestions = data.used_paid_traffic === 'past' || data.used_paid_traffic === 'current';
  const showExpectations = data.used_paid_traffic === 'never';

  return (
    <div className="space-y-6">
      {/* Experiência com tráfego pago */}
      <div>
        <Label className="text-base font-medium">
          Você já utilizou tráfego pago para sua clínica? *
        </Label>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {[
            { value: 'current', label: '✅ Sim, uso atualmente', desc: 'Tenho campanhas ativas' },
            { value: 'past', label: '⏸️ Já usei anteriormente', desc: 'Usei no passado mas parei' },
            { value: 'never', label: '❌ Nunca usei', desc: 'Primeira experiência com tráfego pago' }
          ].map(option => (
            <Card 
              key={option.value} 
              className={`cursor-pointer transition-all ${data.used_paid_traffic === option.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => updateData('used_paid_traffic', option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${data.used_paid_traffic === option.value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Perguntas para quem já usou */}
      {showPlatformQuestions && (
        <>
          {/* Plataformas utilizadas */}
          <div>
            <Label className="text-base font-medium">
              Quais plataformas você {data.used_paid_traffic === 'current' ? 'usa' : 'já usou'}?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {platforms.map(platform => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={data.platforms?.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <Label htmlFor={platform.id} className="cursor-pointer">
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Investimento anterior */}
          <div>
            <Label htmlFor="prev_spend">
              Qual era o investimento mensal aproximado? (R$)
            </Label>
            <Input
              id="prev_spend"
              type="number"
              value={data.prev_monthly_spend || ''}
              onChange={(e) => updateData('prev_monthly_spend', Number(e.target.value))}
              placeholder="Ex: 1500"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor aproximado em reais, apenas para contexto
            </p>
          </div>

          {/* Resultado percebido */}
          <div>
            <Label className="text-base font-medium">
              Como você avalia os resultados obtidos?
            </Label>
            <div className="space-y-2 mt-3">
              {results.map(result => (
                <div key={result} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`result-${result}`}
                    name="marketing_result"
                    value={result}
                    checked={data.expectations === result}
                    onChange={(e) => updateData('expectations', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor={`result-${result}`} className="cursor-pointer text-sm">
                    {result}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Expectativas para quem nunca usou */}
      {showExpectations && (
        <div>
          <Label className="text-base font-medium">
            Quais são suas expectativas com o tráfego pago?
          </Label>
          <div className="space-y-2 mt-3">
            {expectations.map(expectation => (
              <div key={expectation} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`expectation-${expectation}`}
                  name="marketing_expectation"
                  value={expectation}
                  checked={data.expectations === expectation}
                  onChange={(e) => updateData('expectations', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor={`expectation-${expectation}`} className="cursor-pointer text-sm">
                  {expectation}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};