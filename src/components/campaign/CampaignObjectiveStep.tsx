
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';

interface ObjectiveOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface CampaignObjectiveStepProps {
  selectedObjective: string;
  onObjectiveChange: (objective: string) => void;
}

const objectives: ObjectiveOption[] = [
  {
    id: 'whatsapp_sales',
    title: 'Quero vender no WhatsApp',
    description: 'Direcione clientes para conversas de vendas no WhatsApp',
    icon: '💬'
  },
  {
    id: 'website_visits',
    title: 'Quero visitantes no meu Site',
    description: 'Aumente o tráfego e visitas ao seu site ou loja online',
    icon: '🌐'
  },
  {
    id: 'social_engagement',
    title: 'Quero curtidas e seguidores',
    description: 'Aumente o engajamento e ganhe mais seguidores nas redes sociais',
    icon: '❤️'
  }
];

export const CampaignObjectiveStep: React.FC<CampaignObjectiveStepProps> = ({
  selectedObjective,
  onObjectiveChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Definir Objetivo</span>
        </CardTitle>
        <CardDescription>
          Escolha o objetivo principal da sua campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup 
          value={selectedObjective} 
          onValueChange={onObjectiveChange}
        >
          {objectives.map((objective) => (
            <Card key={objective.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={objective.id} id={objective.id} />
                  <div className="flex-1">
                    <Label htmlFor={objective.id} className="flex items-center space-x-3 cursor-pointer">
                      <span className="text-2xl">{objective.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{objective.title}</h3>
                        <p className="text-sm text-gray-600">{objective.description}</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
