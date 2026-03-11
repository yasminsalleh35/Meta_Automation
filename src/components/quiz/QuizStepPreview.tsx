import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { QuizStep } from '@/types/quiz';
import { DynamicQuizStep } from './DynamicQuizStep';
import { Eye } from 'lucide-react';

interface QuizStepPreviewProps {
  step: QuizStep | null;
}

export const QuizStepPreview: React.FC<QuizStepPreviewProps> = ({ step }) => {
  const [previewValue, setPreviewValue] = useState<any>('');

  if (!step) {
    return (
      <Card className="p-8 text-center text-muted-foreground border-2 border-dashed">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Selecione um step para visualizar</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 pb-4 border-b">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Eye className="w-3 h-3" />
          <span>Preview do Step</span>
        </div>
        <h3 className="font-semibold text-sm">
          Como aparecerá no quiz público
        </h3>
      </div>

      <div className="bg-background/50 rounded-lg p-6">
        <DynamicQuizStep
          step={step}
          value={previewValue}
          onChange={setPreviewValue}
        />
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground mb-2">Valor capturado:</p>
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {JSON.stringify(previewValue) || 'null'}
        </code>
      </div>
    </Card>
  );
};
