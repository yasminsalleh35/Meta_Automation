import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { QuizStep } from '@/types/quiz';
import { GripVertical, Pencil, Trash2, Eye } from 'lucide-react';

interface QuizStepsListProps {
  steps: QuizStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onEditStep: (step: QuizStep) => void;
  onDeleteStep: (stepId: string) => void;
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Múltipla Escolha',
  checkbox: 'Checkbox',
  text: 'Texto',
  number: 'Número',
  select: 'Select',
  slider: 'Slider',
  date: 'Data',
  info: 'Info',
};

const categoryColors: Record<string, string> = {
  urgency: 'bg-red-500/10 text-red-700 dark:text-red-300',
  budget: 'bg-green-500/10 text-green-700 dark:text-green-300',
  needs: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  profile: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

export const QuizStepsList: React.FC<QuizStepsListProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  onEditStep,
  onDeleteStep,
}) => {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isSelected = selectedStepId === step.id;
        
        return (
          <Card
            key={step.id}
            className={`
              p-4 transition-all cursor-pointer
              ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}
            `}
            onClick={() => onSelectStep(step.id)}
          >
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab mt-1" />

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[step.type] || step.type}
                  </Badge>
                  {step.category && (
                    <Badge className={`text-xs ${categoryColors[step.category]}`}>
                      {step.category}
                    </Badge>
                  )}
                  {step.required && (
                    <Badge variant="destructive" className="text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </div>

                <h4 className="font-medium text-sm mb-1 truncate">
                  {step.title}
                </h4>
                
                {step.subtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {step.subtitle}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Campo: {step.field_name}</span>
                  <span>•</span>
                  <span>Peso: {step.weight}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStep(step.id);
                  }}
                  className="h-8 w-8"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStep(step);
                  }}
                  className="h-8 w-8"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Deseja excluir este step?')) {
                      onDeleteStep(step.id);
                    }
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {steps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">Nenhum step criado ainda.</p>
          <p className="text-xs mt-1">Clique em "Novo Step" para começar.</p>
        </div>
      )}
    </div>
  );
};
