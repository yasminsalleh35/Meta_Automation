import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';

interface ClearAllButtonProps {
  onClearComplete?: () => void;
  isDisabled?: boolean;
  onConfirm: () => Promise<boolean>;
}

export const ClearAllButton: React.FC<ClearAllButtonProps> = ({
  onClearComplete,
  isDisabled = false,
  onConfirm,
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      const success = await onConfirm();
      if (success) {
        setIsOpen(false);
        onClearComplete?.();
      }
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar Tudo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar todas as informações?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta ação irá <strong>remover todos os dados preenchidos</strong> do seu negócio.
            </p>
            <p>
              Você precisará preencher novamente todas as informações.
            </p>
            <p className="text-destructive font-medium">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isClearing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isClearing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Limpando...
              </>
            ) : (
              'Limpar Tudo'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
