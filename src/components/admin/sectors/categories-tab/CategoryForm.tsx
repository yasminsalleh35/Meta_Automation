
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  categoryName: string;
  categoryDescription: string;
  onCategoryNameChange: (value: string) => void;
  onCategoryDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  title,
  description,
  categoryName,
  categoryDescription,
  onCategoryNameChange,
  onCategoryDescriptionChange,
  onSubmit,
  onCancel,
  submitLabel
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => onCategoryNameChange(e.target.value)}
              placeholder="Ex: Saúde, Tecnologia, Educação..."
            />
          </div>
          <div>
            <Label htmlFor="categoryDescription">Descrição</Label>
            <Textarea
              id="categoryDescription"
              value={categoryDescription}
              onChange={(e) => onCategoryDescriptionChange(e.target.value)}
              placeholder="Descrição da categoria..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
