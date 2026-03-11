import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Type, 
  Hash, 
  List, 
  CheckSquare, 
  Circle, 
  Calendar, 
  Sliders, 
  Info 
} from 'lucide-react';

interface QuizStepTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

const stepTypes = [
  { value: 'multiple_choice', label: 'Múltipla Escolha', icon: Circle },
  { value: 'checkbox', label: 'Checkbox (Várias)', icon: CheckSquare },
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'select', label: 'Select (Dropdown)', icon: List },
  { value: 'slider', label: 'Slider', icon: Sliders },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'info', label: 'Informação', icon: Info },
];

export const QuizStepTypeSelector: React.FC<QuizStepTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      <Label>Tipo de Step</Label>
      <div className="grid grid-cols-2 gap-2">
        {stepTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50 hover:bg-accent'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
