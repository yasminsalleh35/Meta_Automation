
import * as React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ResponsiveSheetProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ResponsiveSheet({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  side = 'bottom',
}: ResponsiveSheetProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent 
          side={side} 
          className={`w-full flex flex-col overflow-hidden ${
            side === 'bottom' ? 'h-[90vh] rounded-t-xl' : ''
          }`}
        >
          {(title || description) && (
            <SheetHeader className="flex-shrink-0 pb-4 border-b">
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
