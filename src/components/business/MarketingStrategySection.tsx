
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Target, Users } from 'lucide-react';

interface MarketingStrategySectionProps {
  form: UseFormReturn<any>;
}

const MarketingStrategySection: React.FC<MarketingStrategySectionProps> = ({
  form
}) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Target className="w-6 h-6 mr-3 text-orange-600" />
          Estratégia de Marketing
        </CardTitle>
        <CardDescription className="text-lg">
          Informações para otimizar suas campanhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-base font-medium flex items-center">
            <Users className="w-4 h-4 mr-2 text-orange-600" />
            Público-alvo
          </Label>
          <Controller
            name="targetAudience"
            control={form.control}
            render={({ field }) => (
              <>
                <Textarea
                  {...field}
                  id="targetAudience"
                  placeholder="Descreva seu público-alvo: idade, interesses, comportamentos..."
                  className="min-h-24 border-0 shadow-md focus:shadow-lg transition-shadow resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value?.length || 0} / 5000 caracteres
                </p>
              </>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessGoals" className="text-base font-medium flex items-center">
            <Target className="w-4 h-4 mr-2 text-orange-600" />
            Objetivos do Negócio
          </Label>
          <Controller
            name="businessGoals"
            control={form.control}
            render={({ field }) => (
              <>
                <Textarea
                  {...field}
                  id="businessGoals"
                  placeholder="Quais são seus principais objetivos? Vendas, leads, reconhecimento..."
                  className="min-h-24 border-0 shadow-md focus:shadow-lg transition-shadow resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value?.length || 0} / 5000 caracteres
                </p>
              </>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingStrategySection;
