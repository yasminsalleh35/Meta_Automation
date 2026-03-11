
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SectorCategory, SectorSpecialization } from '@/types/sectors';

interface SpecializationsTabProps {
  categories: SectorCategory[];
  onAddSpecialization: (specialization: { categoryId: string; name: string; description: string }) => void;
  onUpdateSpecialization: (id: string, updates: { name: string; description: string }) => void;
  onDeleteSpecialization: (id: string) => void;
}

export const SpecializationsTab: React.FC<SpecializationsTabProps> = ({
  categories,
  onAddSpecialization,
  onUpdateSpecialization,
  onDeleteSpecialization
}) => {
  const [showAddSpecialization, setShowAddSpecialization] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState<SectorSpecialization | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newSpecializationName, setNewSpecializationName] = useState('');
  const [newSpecializationDescription, setNewSpecializationDescription] = useState('');

  const handleAddSpecialization = () => {
    if (newSpecializationName.trim() && selectedCategoryId) {
      onAddSpecialization({
        categoryId: selectedCategoryId,
        name: newSpecializationName,
        description: newSpecializationDescription
      });
      setNewSpecializationName('');
      setNewSpecializationDescription('');
      setShowAddSpecialization(false);
      setSelectedCategoryId('');
    }
  };

  const handleEditSpecialization = (specialization: SectorSpecialization) => {
    setEditingSpecialization(specialization);
    setNewSpecializationName(specialization.name);
    setNewSpecializationDescription(specialization.description || '');
    setSelectedCategoryId(specialization.categoryId);
  };

  const handleUpdateSpecialization = () => {
    if (editingSpecialization && newSpecializationName.trim()) {
      onUpdateSpecialization(editingSpecialization.id, {
        name: newSpecializationName,
        description: newSpecializationDescription
      });
      setEditingSpecialization(null);
      setNewSpecializationName('');
      setNewSpecializationDescription('');
      setSelectedCategoryId('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Especializações</CardTitle>
            <CardDescription>Gerencie as especializações dentro de cada categoria</CardDescription>
          </div>
          <Dialog open={showAddSpecialization} onOpenChange={setShowAddSpecialization}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Especialização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Especialização</DialogTitle>
                <DialogDescription>
                  Crie uma nova especialização dentro de uma categoria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="specializationName">Nome da Especialização</Label>
                  <Input
                    id="specializationName"
                    value={newSpecializationName}
                    onChange={(e) => setNewSpecializationName(e.target.value)}
                    placeholder="Ex: Odontologia, Nutrição..."
                  />
                </div>
                <div>
                  <Label htmlFor="specializationDescription">Descrição</Label>
                  <Textarea
                    id="specializationDescription"
                    value={newSpecializationDescription}
                    onChange={(e) => setNewSpecializationDescription(e.target.value)}
                    placeholder="Descrição da especialização..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddSpecialization(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddSpecialization}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-semibold text-lg mb-3">{category.name}</h3>
              <div className="grid gap-3 pl-4">
                {category.specializations.map((specialization) => (
                  <Card key={specialization.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{specialization.name}</h4>
                        {specialization.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {specialization.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSpecialization(specialization)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a especialização "{specialization.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteSpecialization(specialization.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
                {category.specializations.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma especialização cadastrada nesta categoria
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit Specialization Dialog */}
      <Dialog open={!!editingSpecialization} onOpenChange={() => setEditingSpecialization(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Especialização</DialogTitle>
            <DialogDescription>
              Atualize as informações da especialização
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="editSpecializationName">Nome da Especialização</Label>
              <Input
                id="editSpecializationName"
                value={newSpecializationName}
                onChange={(e) => setNewSpecializationName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editSpecializationDescription">Descrição</Label>
              <Textarea
                id="editSpecializationDescription"
                value={newSpecializationDescription}
                onChange={(e) => setNewSpecializationDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSpecialization(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateSpecialization}>
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
