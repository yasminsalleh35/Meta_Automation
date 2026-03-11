import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSectorData } from '@/hooks/useSectorData';
import { CategoriesTab } from '@/components/admin/sectors/CategoriesTab';
import { ProfilesTab } from '@/components/admin/sectors/ProfilesTab';
import { SpecializationsTab } from '@/components/admin/sectors/SpecializationsTab';
import { TemplatesTab } from '@/components/admin/sectors/TemplatesTab';
import { Loader2 } from 'lucide-react';

const AdminSectors = () => {
  const { sectorData, loading, actions } = useSectorData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Setores</h1>
        <p className="text-muted-foreground">Gerencie categorias, especializações, perfis e templates de campanha.</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="specializations">Especializações</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesTab
            categories={sectorData.categories}
            onAdd={actions.addCategory}
            onUpdate={actions.updateCategory}
            onDelete={actions.deleteCategory}
          />
        </TabsContent>

        <TabsContent value="specializations">
          <SpecializationsTab
            categories={sectorData.categories}
            onAdd={actions.addSpecialization}
            onUpdate={actions.updateSpecialization}
            onDelete={actions.deleteSpecialization}
          />
        </TabsContent>

        <TabsContent value="profiles">
          <ProfilesTab
            profiles={sectorData.sectorProfiles}
            categories={sectorData.categories}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab
            campaignTemplates={sectorData.campaignTemplates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSectors;
