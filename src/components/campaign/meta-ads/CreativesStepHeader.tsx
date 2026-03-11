
import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CreativesStepHeader: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <Palette className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configure seus criativos
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Defina as informações básicas da campanha, selecione suas páginas e crie o conteúdo do anúncio.
          </p>
        </div>
      </div>

      {/* Tip Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Sparkles className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Dica:</strong> Use textos claros e diretos. Mostre o benefício principal do seu produto/serviço logo no início!
        </AlertDescription>
      </Alert>
    </div>
  );
};
