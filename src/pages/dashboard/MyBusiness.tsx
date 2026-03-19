import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useProfilesList } from '@/hooks/useCampaignProfiles';
import { useSectorData } from '@/hooks/useSectorData';
import BusinessHeader from '@/components/business/BusinessHeader';
import BasicInfoSection from '@/components/business/BasicInfoSection';
import { CampaignProfileSection } from '@/components/business/CampaignProfileSection';
import MarketingStrategySection from '@/components/business/MarketingStrategySection';
import { SpecialtiesSection } from '@/components/business/SpecialtiesSection';
import { StrategicReportsSection } from '@/components/business/StrategicReportsSection';
import FormActionsBar from '@/components/business/FormActionsBar';
import { BusinessSummary } from '@/components/business/BusinessSummary';
import { WhatsAppBusinessInput } from '@/components/business/WhatsAppBusinessInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Phone } from 'lucide-react';

const MyBusiness: React.FC = () => {
  const { 
    businessData, 
    updateBusinessData, 
    saveBusinessSettings,
    clearAllBusinessSettings,
    isLoading, 
    isSaving 
  } = useBusinessSettings();
  
  const { data: profiles } = useProfilesList({ onlyActive: true });
  const { sectorData } = useSectorData();
  
  const [specialization, setSpecialization] = useState<string>('');
  const [ticketValues, setTicketValues] = useState<Record<string, number>>({});
  
  // Initialize viewMode based on existing data
  const [viewMode, setViewMode] = useState(() => {
    const hasData = !!(businessData.name || businessData.description || businessData.mainProduct);
    const hasProfile = !!businessData.campaign_profile_id;
    return hasData && hasProfile;
  });

  // Form setup for controlled inputs
  const form = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      mainProduct: '',
      category: '',
      targetAudience: '',
      businessGoals: '',
      campaign_profile_id: '',
      odontSpecialties: [],
      targetAgeMin: 18,
      targetAgeMax: 65,
      specialtyTickets: {},
      strategic_notes: '',
    }
  });

  // Get selected profile
  const selectedProfile = useMemo(() => {
    if (!businessData.campaign_profile_id || !profiles) return null;
    return profiles.find(p => p.id === businessData.campaign_profile_id) || null;
  }, [businessData.campaign_profile_id, profiles]);

  // Update form when businessData changes — only when NOT actively editing (viewMode)
  // or on initial load. Do NOT reset form during saves to prevent wiping user input.
  useEffect(() => {
    if (businessData && (viewMode || isLoading)) {
      form.reset({
        name: businessData.name || '',
        description: businessData.description || '',
        mainProduct: businessData.mainProduct || '',
        category: businessData.category || '',
        targetAudience: businessData.targetAudience || '',
        businessGoals: businessData.businessGoals || '',
        campaign_profile_id: businessData.campaign_profile_id || '',
        odontSpecialties: businessData.odontSpecialties || [],
        targetAgeMin: businessData.targetAgeMin || 18,
        targetAgeMax: businessData.targetAgeMax || 65,
        specialtyTickets: businessData.specialtyTickets || {},
        strategic_notes: businessData.strategic_notes || '',
      });
    }
  }, [businessData, viewMode, isLoading]);

  // Load ticket values when businessData changes
  useEffect(() => {
    setTicketValues(businessData.specialtyTickets || {});
  }, [businessData.specialtyTickets]);

  const handleTicketValuesChange = (newTickets: Record<string, number>) => {
    setTicketValues(newTickets);
    form.setValue('specialtyTickets', newTickets, { shouldDirty: true });
  };

  // Load specialization from localStorage
  useEffect(() => {
    const savedSpecialization = localStorage.getItem('selected_specialization');
    if (savedSpecialization) {
      setSpecialization(savedSpecialization);
    }
  }, []);

  // Listen for specialization changes
  useEffect(() => {
    const handleSpecializationChange = (event: CustomEvent) => {
      setSpecialization(event.detail);
    };

    window.addEventListener('specializationChanged', handleSpecializationChange as EventListener);
    
    return () => {
      window.removeEventListener('specializationChanged', handleSpecializationChange as EventListener);
    };
  }, []);

  const onSave = async (formData: any) => {
    const success = await saveBusinessSettings(formData, { origin: 'manual' });
    if (success) {
      console.log('MY_BUSINESS_SAVED', new Date().toISOString());
      setViewMode(true);
    }
  };

  const handleSubmit = form.handleSubmit(onSave);

  const handleProfileChange = async (profileId: string | null) => {
    // Update form value
    form.setValue('campaign_profile_id', profileId, { shouldDirty: true });
    // Save just the profile ID without collapsing
    const currentValues = form.getValues();
    await saveBusinessSettings({ ...currentValues, campaign_profile_id: profileId }, { origin: 'profile' });
    // Do NOT set viewMode here
  };

  const onEdit = () => {
    setViewMode(false);
  };

  const handleClearComplete = () => {
    // Reset form
    form.reset({
      name: '',
      description: '',
      mainProduct: '',
      category: '',
      targetAudience: '',
      businessGoals: '',
      campaign_profile_id: '',
      odontSpecialties: [],
      targetAgeMin: 18,
      targetAgeMax: 65,
      specialtyTickets: {},
      strategic_notes: '',
    });
    
    // Clear local states
    setSpecialization('');
    setTicketValues({});
    
    // Force edit mode
    setViewMode(false);
    
    // Clear localStorage
    localStorage.removeItem('selected_specialization');
    localStorage.removeItem('camply_business_data');
    
    // Dispatch specialization changed event
    window.dispatchEvent(new CustomEvent('specializationChanged', { detail: '' }));
  };

  // Log profile selection
  useEffect(() => {
    if (businessData.campaign_profile_id && selectedProfile) {
      console.log('PROFILE_SELECTED', selectedProfile.id, selectedProfile.slug);
    }
  }, [businessData.campaign_profile_id, selectedProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do negócio...</p>
        </div>
      </div>
    );
  }

  // View Mode (Collapsed/Summary)
  const hasData = !!(businessData.name || businessData.description || businessData.mainProduct);
  if (viewMode && businessData.campaign_profile_id && hasData) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto p-6">
        <BusinessHeader businessData={businessData} />
        
        <BusinessSummary
          businessData={businessData}
          selectedProfile={selectedProfile}
          onEdit={onEdit}
        />
      </div>
    );
  }

  const hasExistingData = !!(businessData.name || businessData.campaign_profile_id);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <BusinessHeader businessData={businessData} />
      
      {/* Campaign Profile Selector - Always Visible */}
      <CampaignProfileSection
        businessData={businessData}
        onProfileChange={handleProfileChange}
      />

      {/* Profile Selection Required Message */}
      {!businessData.campaign_profile_id && (
        <Card>
          <CardContent className="p-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Selecione um Perfil de Campanha acima para continuar com o cadastro das informações do seu negócio.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Progressive Fields - Only Show After Profile Selection */}
      {businessData.campaign_profile_id && selectedProfile && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* AI Fields - Always show after profile selection */}
          <BasicInfoSection
            form={form}
            sectorData={sectorData}
            specialization={specialization}
          />
          
          <MarketingStrategySection
            form={form}
          />

          {/* WhatsApp Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
              <CardDescription>
                Número do WhatsApp usado nas suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppBusinessInput
                value={businessData.whatsappNumber || ''}
                onChange={(value) => updateBusinessData('whatsappNumber', value)}
              />
            </CardContent>
          </Card>

          {/* Conditional Sections Based on Profile Flags */}
          {selectedProfile.show_strategic_reports && (
            <StrategicReportsSection
              form={form}
            />
          )}

          {selectedProfile.show_dental_specialties && (
            <SpecialtiesSection
              specialties={form.watch('odontSpecialties') || []}
              ageMin={form.watch('targetAgeMin') || 18}
              ageMax={form.watch('targetAgeMax') || 65}
              businessName={form.watch('name') || ''}
              ticketValues={ticketValues}
              onSpecialtiesChange={(specialties) => form.setValue('odontSpecialties', specialties)}
              onAgeChange={(ageMin, ageMax) => {
                form.setValue('targetAgeMin', ageMin);
                form.setValue('targetAgeMax', ageMax);
              }}
              onTicketValuesChange={handleTicketValuesChange}
            />
          )}
          
          <FormActionsBar
            isSaving={isSaving}
            onSubmit={handleSubmit}
            onClear={clearAllBusinessSettings}
            onClearComplete={handleClearComplete}
            showClearButton={hasExistingData}
          />
        </form>
      )}
    </div>
  );
};

export default MyBusiness;