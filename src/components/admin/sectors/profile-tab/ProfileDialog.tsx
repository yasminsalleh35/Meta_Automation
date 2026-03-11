
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SectorCategory, SectorProfile } from '@/types/sectors';
import { SectorProfileForm } from '@/components/admin/SectorProfileForm';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: SectorCategory[];
  selectedSectorId: string;
  onSectorChange: (sectorId: string) => void;
  editingProfile: SectorProfile | null;
  onSave: (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  getSpecializationName: (sectorId: string) => string;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  open,
  onOpenChange,
  categories,
  selectedSectorId,
  onSectorChange,
  editingProfile,
  onSave,
  onCancel,
  getSpecializationName
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Setor</DialogTitle>
          <DialogDescription>
            Escolha o setor para criar ou editar o perfil detalhado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Setor</Label>
            <select
              className="w-full p-2 border rounded"
              value={selectedSectorId}
              onChange={(e) => onSectorChange(e.target.value)}
            >
              <option value="">Selecione um setor</option>
              {categories.map((category) =>
                category.specializations.map((specialization) => (
                  <option key={specialization.id} value={specialization.id}>
                    {category.name} → {specialization.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {selectedSectorId && (
            <div className="border-t pt-4">
              <SectorProfileForm
                sectorId={selectedSectorId}
                sectorName={getSpecializationName(selectedSectorId)}
                profile={editingProfile || undefined}
                onSave={onSave}
                onCancel={onCancel}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
