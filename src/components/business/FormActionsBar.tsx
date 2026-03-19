import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormActionsBarProps {
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => Promise<boolean>;
  onClearComplete?: () => void;
  showClearButton?: boolean;
}

const FormActionsBar: React.FC<FormActionsBarProps> = ({ 
  isSaving, 
  onSubmit, 
  onClear,
  onClearComplete,
  showClearButton = true 
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleClearClick = () => {
    setShowDialog(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      const success = await onClear();
      if (success) {
        setShowDialog(false);
        onClearComplete?.();
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4">
        {/* Botão Limpar Tudo - Esquerda */}
        {showClearButton && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearClick}
            disabled={isClearing || isSaving}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-300"
          >
            {isClearing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Tudo
              </>
            )}
          </Button>
        )}

        {/* Botão Salvar - Direita */}
        <Button
          type="submit"
          disabled={isSaving || isClearing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-3 text-lg sm:ml-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Informações
            </>
          )}
        </Button>
      </div>

      {/* Alert Dialog para confirmação */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as informações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover todos os dados preenchidos do seu negócio. 
              Você precisará preencher novamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                'Limpar Tudo'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormActionsBar;
