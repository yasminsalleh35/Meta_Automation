
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { SectorCategory, SectorProfile } from '@/types/sectors';
import { ProfileCard } from './profile-tab/ProfileCard';
import { EmptyProfilesState } from './profile-tab/EmptyProfilesState';
import { ProfileDialog } from './profile-tab/ProfileDialog';

interface ProfilesTabProps {
  categories: SectorCategory[];
  profiles: SectorProfile[];
  onCreateProfile: (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProfile: (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}

export const ProfilesTab: React.FC<ProfilesTabProps> = ({
  categories,
  profiles,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile
}) => {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SectorProfile | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');

  const getSpecializationName = (sectorId: string) => {
    for (const category of categories) {
      const specialization = category.specializations.find(s => s.id === sectorId);
      if (specialization) {
        return `${category.name} → ${specialization.name}`;
      }
    }
    return sectorId;
  };

  const handleCreateProfile = async (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await onCreateProfile(profileData);
      setShowProfileForm(false);
      setSelectedSectorId('');
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleUpdateProfile = async (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProfile) {
      try {
        await onUpdateProfile(profileData);
        setShowProfileForm(false);
        setEditingProfile(null);
        setSelectedSectorId('');
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await onDeleteProfile(profileId);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleEditProfile = (profile: SectorProfile) => {
    setEditingProfile(profile);
    setSelectedSectorId(profile.sectorId);
    setShowProfileForm(true);
  };

  const handleCancel = () => {
    setShowProfileForm(false);
    setSelectedSectorId('');
    setEditingProfile(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Perfis de Setores</CardTitle>
            <CardDescription>Configure perfis detalhados para otimizar campanhas de IA</CardDescription>
          </div>
          <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <ProfileDialog
              open={showProfileForm}
              onOpenChange={setShowProfileForm}
              categories={categories}
              selectedSectorId={selectedSectorId}
              onSectorChange={setSelectedSectorId}
              editingProfile={editingProfile}
              onSave={editingProfile ? handleUpdateProfile : handleCreateProfile}
              onCancel={handleCancel}
              getSpecializationName={getSpecializationName}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              sectorName={getSpecializationName(profile.sectorId)}
              onEdit={handleEditProfile}
              onDelete={handleDeleteProfile}
            />
          ))}
          {profiles.length === 0 && <EmptyProfilesState />}
        </div>
      </CardContent>
    </Card>
  );
};
