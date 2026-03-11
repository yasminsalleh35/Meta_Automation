import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { QuizStepTypeSelector } from './QuizStepTypeSelector';
import { QuizStepOptionsEditor } from './QuizStepOptionsEditor';
import { QuizStep } from '@/types/quiz';
import { Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface QuizStepEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step?: QuizStep | null;
  orderIndex: number;
  onSave: (stepData: Partial<QuizStep>) => void;
}

export const QuizStepEditor: React.FC<QuizStepEditorProps> = ({
  open,
  onOpenChange,
  step,
  orderIndex,
  onSave,
}) => {
  const [type, setType] = useState<string>('multiple_choice');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [required, setRequired] = useState(true);
  const [weight, setWeight] = useState([5]);
  const [category, setCategory] = useState<string>('needs');
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (step) {
      setType(step.type);
      setTitle(step.title);
      setSubtitle(step.subtitle || '');
      setFieldName(step.field_name);
      setRequired(step.required);
      setWeight([step.weight]);
      setCategory(step.category || 'needs');
      setOptions(step.options || []);
    } else {
      // Reset for new step
      setType('multiple_choice');
      setTitle('');
      setSubtitle('');
      setFieldName('');
      setRequired(true);
      setWeight([5]);
      setCategory('needs');
      setOptions([]);
    }
  }, [step, open]);

  const handleSave = () => {
    const stepData: Partial<QuizStep> = {
      id: step?.id,
      type: type as QuizStep['type'],
      title,
      subtitle: subtitle || undefined,
      field_name: fieldName,
      required,
      weight: weight[0],
      category: category as QuizStep['category'],
      order_index: step?.order_index ?? orderIndex,
    };

    // Add options for relevant types
    if (['multiple_choice', 'checkbox', 'select'].includes(type)) {
      stepData.options = options;
    }

    onSave(stepData);
    onOpenChange(false);
  };

  const needsOptions = ['multiple_choice', 'checkbox', 'select'].includes(type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{step ? 'Editar Step' : 'Novo Step'}</SheetTitle>
          <SheetDescription>
            Configure o step do quiz. Os campos marcados são obrigatórios.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Type Selector */}
          <QuizStepTypeSelector value={type} onChange={setType} />

          <Separator />

          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Step*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Qual é o principal objetivo do seu negócio?"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Texto explicativo adicional..."
                className="mt-2"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="fieldName">Nome do Campo (field_name)*</Label>
              <Input
                id="fieldName"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Ex: main_objective"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para armazenar a resposta no banco. Use snake_case.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="required">Campo Obrigatório</Label>
                <p className="text-xs text-muted-foreground">
                  Usuário deve responder para avançar
                </p>
              </div>
              <Switch
                id="required"
                checked={required}
                onCheckedChange={setRequired}
              />
            </div>
          </div>

          {/* Options Editor (conditional) */}
          {needsOptions && (
            <>
              <Separator />
              <QuizStepOptionsEditor options={options} onChange={setOptions} />
            </>
          )}

          <Separator />

          {/* AI Scoring Configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Configuração de IA</Label>
              <p className="text-sm text-muted-foreground">
                Defina como este step influencia a pontuação do lead
              </p>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency">Urgência (peso 5x)</SelectItem>
                  <SelectItem value="budget">Orçamento (peso 4x)</SelectItem>
                  <SelectItem value="needs">Necessidades (peso 3x)</SelectItem>
                  <SelectItem value="profile">Perfil (peso 2x)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Categorias têm pesos diferentes na análise de IA
              </p>
            </div>

            <div>
              <Label htmlFor="weight">
                Peso Individual: {weight[0]}
              </Label>
              <Slider
                id="weight"
                min={1}
                max={10}
                step={1}
                value={weight}
                onValueChange={setWeight}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quanto maior o peso, mais importante é este step na pontuação
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title || !fieldName}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Step
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
