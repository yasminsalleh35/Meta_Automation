import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
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

interface ConfirmActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

// ADM-05: botão de ação destrutiva com diálogo de confirmação.
export const ConfirmActionButton: React.FC<ConfirmActionButtonProps> = ({
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
  children,
  ...buttonProps
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" {...buttonProps}>
        {children}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => { void onConfirm(); }}>
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
