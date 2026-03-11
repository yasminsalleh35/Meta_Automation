
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { SectorCategory } from '@/types/sectors';
import { CategoryCard } from './categories-tab/CategoryCard';
import { CategoryForm } from './categories-tab/CategoryForm';

interface CategoriesTabProps {
  categories: SectorCategory[];
  onAddCategory: (category: { name: string; description: string }) => void;
  onUpdateCategory: (id: string, updates: { name: string; description: string }) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SectorCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory({
        name: newCategoryName,
        description: newCategoryDescription
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowAddCategory(false);
    }
  };

  const handleEditCategory = (category: SectorCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
  };

  const handleUpdateCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      onUpdateCategory(editingCategory.id, {
        name: newCategoryName,
        description: newCategoryDescription
      });
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
    }
  };

  const handleCancelAdd = () => {
    setShowAddCategory(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Categorias de Setores</CardTitle>
            <CardDescription>Gerencie as principais categorias de negócios</CardDescription>
          </div>
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <CategoryForm
              open={showAddCategory}
              onOpenChange={setShowAddCategory}
              title="Adicionar Nova Categoria"
              description="Crie uma nova categoria de setor para organizar as especializações"
              categoryName={newCategoryName}
              categoryDescription={newCategoryDescription}
              onCategoryNameChange={setNewCategoryName}
              onCategoryDescriptionChange={setNewCategoryDescription}
              onSubmit={handleAddCategory}
              onCancel={handleCancelAdd}
              submitLabel="Adicionar"
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEditCategory}
              onDelete={onDeleteCategory}
            />
          ))}
        </div>
      </CardContent>

      {/* Edit Category Dialog */}
      <CategoryForm
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
        title="Editar Categoria"
        description="Atualize as informações da categoria"
        categoryName={newCategoryName}
        categoryDescription={newCategoryDescription}
        onCategoryNameChange={setNewCategoryName}
        onCategoryDescriptionChange={setNewCategoryDescription}
        onSubmit={handleUpdateCategory}
        onCancel={handleCancelEdit}
        submitLabel="Atualizar"
      />
    </Card>
  );
};
