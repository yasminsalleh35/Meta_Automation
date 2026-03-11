import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface StepBudgetGoalProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const budgetRanges = [
  { value: 'under-1k', label: 'Até R$ 1.000', desc: 'Para começar gradualmente' },
  { value: '1k-2k', label: 'R$ 1.000 - R$ 2.000', desc: 'Investimento moderado' },
  { value: '2k-5k', label: 'R$ 2.000 - R$ 5.000', desc: 'Crescimento acelerado' },
  { value: '5k-10k', label: 'R$ 5.000 - R$ 10.000', desc: 'Expansão significativa' },
  { value: 'over-10k', label: 'Mais de R$ 10.000', desc: 'Máximo crescimento' },
];

const goals = [
  { value: 'leads', label: '📞 Gerar mais consultas', desc: 'Foco em conversões diretas' },
  { value: 'branding', label: '🏆 Fortalecer a marca', desc: 'Aumentar reconhecimento' },
  { value: 'launch', label: '🚀 Lançar novo serviço', desc: 'Divulgar novos tratamentos' },
  { value: 'compete', label: '⚔️ Competir no mercado', desc: 'Superar concorrentes' },
  { value: 'premium', label: '💎 Atrair pacientes premium', desc: 'Clientes de maior valor' },
  { value: 'diversify', label: '🔄 Diversificar tratamentos', desc: 'Expandir especialidades' },
];

const timings = [
  { value: 'immediate', label: '🚀 Imediatamente', desc: 'Quero começar agora' },
  { value: '30d', label: '📅 Em até 30 dias', desc: 'Preparação rápida' },
  { value: '60d', label: '⏰ Em 30-60 dias', desc: 'Planejamento adequado' },
  { value: '90d+', label: '📋 Em mais de 60 dias', desc: 'Planejamento detalhado' },
];

export const StepBudgetGoal: React.FC<StepBudgetGoalProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-8">
      {/* Faixa de investimento */}
      <div>
        <Label className="text-base font-medium">
          Qual faixa de investimento mensal você tem em mente? *
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Considere um valor confortável para investir mensalmente em marketing digital
        </p>
        <div className="grid grid-cols-1 gap-3">
          {budgetRanges.map(range => (
            <Card 
              key={range.value}
              className={`cursor-pointer transition-all ${data.desired_monthly_spend_range === range.value ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
              onClick={() => updateData('desired_monthly_spend_range', range.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${data.desired_monthly_spend_range === range.value ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{range.label}</p>
                    <p className="text-sm text-gray-600">{range.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Objetivo principal */}
      <div>
        <Label className="text-base font-medium">
          Qual é seu principal objetivo? *
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {goals.map(goal => (
            <Card 
              key={goal.value}
              className={`cursor-pointer transition-all ${data.main_goal === goal.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => updateData('main_goal', goal.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 ${data.main_goal === goal.value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="font-medium text-sm">{goal.label}</p>
                    <p className="text-xs text-gray-600">{goal.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Prazo para início */}
      <div>
        <Label className="text-base font-medium">
          Quando você gostaria de começar? *
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {timings.map(timing => (
            <Card 
              key={timing.value}
              className={`cursor-pointer transition-all ${data.start_timing === timing.value ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
              onClick={() => updateData('start_timing', timing.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${data.start_timing === timing.value ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="font-medium text-sm">{timing.label}</p>
                    <p className="text-xs text-gray-600">{timing.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};