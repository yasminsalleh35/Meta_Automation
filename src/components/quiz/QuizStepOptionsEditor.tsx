import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface QuizStepOptionsEditorProps {
  options: Option[];
  onChange: (options: Option[]) => void;
}

export const QuizStepOptionsEditor: React.FC<QuizStepOptionsEditorProps> = ({
  options,
  onChange,
}) => {
  const addOption = () => {
    onChange([...options, { value: '', label: '' }]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'value' | 'label', newValue: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Opções</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <GripVertical className="w-4 h-4 mt-2 text-muted-foreground cursor-grab" />
            
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Valor (usado internamente)"
                value={option.value}
                onChange={(e) => updateOption(index, 'value', e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Label (exibido ao usuário)"
                value={option.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
                className="text-sm"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
              className="mt-1"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}

        {options.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
            Nenhuma opção. Clique em "Adicionar" para criar.
          </div>
        )}
      </div>
    </div>
  );
};
