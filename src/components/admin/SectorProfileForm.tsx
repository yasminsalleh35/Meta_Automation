
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target } from 'lucide-react';
import { SectorProfile } from '@/types/sectors';
import { DemographicsTab } from './sectors/profile-form/DemographicsTab';
import { BehaviorTab } from './sectors/profile-form/BehaviorTab';
import { ChannelsTab } from './sectors/profile-form/ChannelsTab';
import { InterestsTab } from './sectors/profile-form/InterestsTab';
import { AdsSegmentationTab } from './sectors/profile-form/AdsSegmentationTab';

interface SectorProfileFormProps {
  profile?: SectorProfile;
  sectorId: string;
  sectorName: string;
  onSave: (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const SectorProfileForm: React.FC<SectorProfileFormProps> = ({
  profile,
  sectorId,
  sectorName,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>({
    sectorId,
    ageRangeMin: 25,
    ageRangeMax: 55,
    genderPreference: 'both',
    socialClass: ['C', 'B'],
    locationType: 'urban',
    locationDetails: '',
    professions: [''],
    incomeRangeMin: 3000,
    incomeRangeMax: 12000,
    purchaseBehaviors: [''],
    decisionFactors: [''],
    priceSensitivity: 'medium',
    paymentPreferences: [''],
    researchHabits: [''],
    preferredChannels: [''],
    marketingStrategies: [''],
    contentTypes: [''],
    mainInterests: [''],
    keywords: [''],
    relatedTopics: [''],
    mentalTriggers: [''],
    psychologicalStrategies: [''],
    metaInterests: [''],
    metaBehaviors: [''],
    geographicRadius: 8
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        sectorId: profile.sectorId,
        ageRangeMin: profile.ageRangeMin || 25,
        ageRangeMax: profile.ageRangeMax || 55,
        genderPreference: profile.genderPreference || 'both',
        socialClass: profile.socialClass || ['C', 'B'],
        locationType: profile.locationType || 'urban',
        locationDetails: profile.locationDetails || '',
        professions: profile.professions || [''],
        incomeRangeMin: profile.incomeRangeMin || 3000,
        incomeRangeMax: profile.incomeRangeMax || 12000,
        purchaseBehaviors: profile.purchaseBehaviors || [''],
        decisionFactors: profile.decisionFactors || [''],
        priceSensitivity: profile.priceSensitivity || 'medium',
        paymentPreferences: profile.paymentPreferences || [''],
        researchHabits: profile.researchHabits || [''],
        preferredChannels: profile.preferredChannels || [''],
        marketingStrategies: profile.marketingStrategies || [''],
        contentTypes: profile.contentTypes || [''],
        mainInterests: profile.mainInterests || [''],
        keywords: profile.keywords || [''],
        relatedTopics: profile.relatedTopics || [''],
        mentalTriggers: profile.mentalTriggers || [''],
        psychologicalStrategies: profile.psychologicalStrategies || [''],
        metaInterests: profile.metaInterests || [''],
        metaBehaviors: profile.metaBehaviors || [''],
        geographicRadius: profile.geographicRadius || 8
      });
    }
  }, [profile]);

  const handleFormDataChange = (updates: Partial<Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = () => {
    // Limpar arrays vazios
    const cleanedData = {
      ...formData,
      professions: formData.professions?.filter(p => p.trim()) || [],
      purchaseBehaviors: formData.purchaseBehaviors?.filter(p => p.trim()) || [],
      decisionFactors: formData.decisionFactors?.filter(p => p.trim()) || [],
      paymentPreferences: formData.paymentPreferences?.filter(p => p.trim()) || [],
      researchHabits: formData.researchHabits?.filter(p => p.trim()) || [],
      preferredChannels: formData.preferredChannels?.filter(p => p.trim()) || [],
      marketingStrategies: formData.marketingStrategies?.filter(p => p.trim()) || [],
      contentTypes: formData.contentTypes?.filter(p => p.trim()) || [],
      mainInterests: formData.mainInterests?.filter(p => p.trim()) || [],
      keywords: formData.keywords?.filter(p => p.trim()) || [],
      relatedTopics: formData.relatedTopics?.filter(p => p.trim()) || [],
      mentalTriggers: formData.mentalTriggers?.filter(p => p.trim()) || [],
      psychologicalStrategies: formData.psychologicalStrategies?.filter(p => p.trim()) || [],
      metaInterests: formData.metaInterests?.filter(p => p.trim()) || [],
      metaBehaviors: formData.metaBehaviors?.filter(p => p.trim()) || []
    };
    
    onSave(cleanedData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Perfil Detalhado: {sectorName}
          </CardTitle>
          <CardDescription>
            Configure informações detalhadas para otimizar a criação de campanhas
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="interests">Interesses</TabsTrigger>
          <TabsTrigger value="ads">Segmentação</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-6">
          <DemographicsTab formData={formData} onFormDataChange={handleFormDataChange} />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <BehaviorTab formData={formData} onFormDataChange={handleFormDataChange} />
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <ChannelsTab formData={formData} onFormDataChange={handleFormDataChange} />
        </TabsContent>

        <TabsContent value="interests" className="space-y-6">
          <InterestsTab formData={formData} onFormDataChange={handleFormDataChange} />
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          <AdsSegmentationTab formData={formData} onFormDataChange={handleFormDataChange} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          {profile ? 'Atualizar Perfil' : 'Criar Perfil'}
        </Button>
      </div>
    </div>
  );
};
