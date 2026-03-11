
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationSettings } from './LocationSettings';
import { BudgetSettingsCard } from './BudgetSettingsCard';
import { DurationSettingsCard } from './DurationSettingsCard';
import { AIOptimizationCard } from './AIOptimizationCard';
import { LocationSettingsData } from '@/types/locationSettings';

interface AdvantageSettingsProps {
  location: LocationSettingsData;
  budget: {
    daily: number;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
  onLocationChange: (field: keyof LocationSettingsData, value: string | number | object) => void;
  onBudgetChange: (value: number) => void;
  onDurationChange: (field: string, value: string) => void;
  onAISuggestion?: () => void;
  isAILoading?: boolean;
}

export const AdvantageSettingsStep: React.FC<AdvantageSettingsProps> = ({
  location,
  budget,
  duration,
  onLocationChange,
  onBudgetChange,
  onDurationChange,
  onAISuggestion,
  isAILoading = false
}) => {
  return (
    <div className="space-y-6">
      {/* Advantage+ Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Campanha Advantage+:</strong> Suas campanhas usam otimização automática do Meta para encontrar os melhores públicos e posicionamentos. Configure apenas localização, orçamento e duração.
        </AlertDescription>
      </Alert>

      {/* Location Settings */}
      <LocationSettings
        location={location}
        onLocationChange={onLocationChange}
      />

      {/* Budget Settings */}
      <BudgetSettingsCard
        budget={budget}
        onBudgetChange={onBudgetChange}
        isAILoading={isAILoading}
      />

      {/* Duration Settings */}
      <DurationSettingsCard
        duration={duration}
        onDurationChange={onDurationChange}
      />

      {/* AI Suggestions */}
      <AIOptimizationCard
        onAISuggestion={onAISuggestion}
        isAILoading={isAILoading}
      />
    </div>
  );
};
