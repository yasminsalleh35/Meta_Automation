import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { ProfilesList } from '@/components/admin/campaign-profiles/ProfilesList';
import { ProfileFormDrawer } from '@/components/admin/campaign-profiles/ProfileFormDrawer';
import { useCreateProfile, useUpdateProfile } from '@/hooks/useCampaignProfiles';
import type { CampaignProfile } from '@/types/campaignProfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminCampaignProfiles() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CampaignProfile | null>(null);
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleNewProfile = () => {
    setEditingProfile(null);
    setDrawerOpen(true);
  };

  const handleEditProfile = (profile: CampaignProfile) => {
    setEditingProfile(profile);
    setDrawerOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingProfile) {
        await updateProfile.mutateAsync({ id: editingProfile.id, ...data });
      } else {
        await createProfile.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error; // Re-throw to let the form handle it
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Perfis de Campanha</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie perfis de targeting que são aplicados automaticamente nas campanhas dos clientes
          </p>
        </div>
        <Button onClick={handleNewProfile} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Perfil
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como funciona?</CardTitle>
          <CardDescription>
            Os perfis de campanha permitem definir configurações de targeting (idade, gênero, interesses, posicionamentos) 
            que são aplicadas automaticamente quando um cliente cria uma campanha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-primary">1. Criar Perfis</div>
              <div className="text-muted-foreground">
                Defina perfis específicos para diferentes nichos (dentistas, autoescolas, academias, etc.)
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-primary">2. Cliente Seleciona</div>
              <div className="text-muted-foreground">
                Na tela "Meu Negócio", o cliente escolhe o perfil mais adequado ao seu setor
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-primary">3. Aplicação Automática</div>
              <div className="text-muted-foreground">
                As configurações do perfil são aplicadas automaticamente na criação das campanhas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profiles List */}
      <ProfilesList onEdit={handleEditProfile} />

      {/* Form Drawer */}
      <ProfileFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initial={editingProfile || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}