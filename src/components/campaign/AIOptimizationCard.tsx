
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface AIOptimizationCardProps {
  onAISuggestion?: () => void;
  isAILoading?: boolean;
}

export const AIOptimizationCard: React.FC<AIOptimizationCardProps> = ({
  onAISuggestion,
  isAILoading = false
}) => {
  if (!onAISuggestion) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Otimização com IA</h3>
              <p className="text-sm text-blue-700">
                Configure automaticamente localização e orçamento baseado no seu negócio
              </p>
            </div>
          </div>
          <Button 
            onClick={onAISuggestion}
            disabled={isAILoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAILoading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Configurar com IA
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
