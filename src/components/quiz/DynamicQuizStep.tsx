import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizStepProps {
  step: {
    type: string;
    title: string;
    subtitle?: string;
    field_name: string;
    options?: any[];
    required: boolean;
  };
  value: any;
  onChange: (value: any) => void;
}

export const DynamicQuizStep: React.FC<QuizStepProps> = ({ step, value, onChange }) => {
  const renderStep = () => {
    switch (step.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground text-sm">{step.subtitle}</p>}
            </div>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Digite sua resposta..."
              className="text-lg"
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground text-sm">{step.subtitle}</p>}
            </div>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(Number(e.target.value))}
              placeholder="Digite um número..."
              className="text-lg"
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground text-sm">{step.subtitle}</p>}
            </div>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Selecione uma opção..." />
              </SelectTrigger>
              <SelectContent>
                {step.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground text-sm">{step.subtitle}</p>}
            </div>
            <RadioGroup value={value || ''} onValueChange={onChange}>
              {step.options?.map((option: any) => (
                <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        const selectedValues = (value || []) as string[];
        const handleCheckboxChange = (optionValue: string, checked: boolean) => {
          if (checked) {
            onChange([...selectedValues, optionValue]);
          } else {
            onChange(selectedValues.filter((v: string) => v !== optionValue));
          }
        };

        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground text-sm">{step.subtitle}</p>}
            </div>
            <div className="space-y-2">
              {step.options?.map((option: any) => (
                <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent">
                  <Checkbox
                    id={option.value}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
                  />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
              {step.subtitle && <p className="text-muted-foreground">{step.subtitle}</p>}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Tipo de campo não suportado: {step.type}</p>
          </div>
        );
    }
  };

  return <div className="space-y-6">{renderStep()}</div>;
};
