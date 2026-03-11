
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { SectorProfile } from '@/types/sectors';

interface ProfileCardProps {
  profile: SectorProfile;
  sectorName: string;
  onEdit: (profile: SectorProfile) => void;
  onDelete: (profileId: string) => Promise<void>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  sectorName,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{sectorName}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Idade:</span> {profile.ageRangeMin}-{profile.ageRangeMax} anos
            </div>
            <div>
              <span className="font-medium">Gênero:</span> {profile.genderPreference || 'Não definido'}
            </div>
            <div>
              <span className="font-medium">Classes:</span> {profile.socialClass?.join(', ') || 'Não definido'}
            </div>
            <div>
              <span className="font-medium">Localização:</span> {profile.locationType || 'Não definido'}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.mainInterests?.slice(0, 3).map((interest, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {(profile.mainInterests?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{(profile.mainInterests?.length || 0) - 3} mais
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(profile)}
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
                  Tem certeza que deseja excluir o perfil de "{sectorName}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(profile.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
