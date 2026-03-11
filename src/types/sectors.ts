
export interface SectorCategory {
  id: string;
  name: string;
  description?: string;
  specializations: SectorSpecialization[];
}

export interface SectorSpecialization {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
}

export interface SectorProfile {
  id: string;
  sectorId: string;
  
  // Público-alvo detalhado
  ageRangeMin?: number;
  ageRangeMax?: number;
  genderPreference?: 'male' | 'female' | 'both' | 'female_predominant' | 'male_predominant';
  socialClass?: string[];
  locationType?: 'urban' | 'suburban' | 'rural' | 'mixed';
  locationDetails?: string;
  professions?: string[];
  incomeRangeMin?: number;
  incomeRangeMax?: number;
  
  // Comportamentos de compra
  purchaseBehaviors?: string[];
  decisionFactors?: string[];
  priceSensitivity?: 'high' | 'medium' | 'low';
  paymentPreferences?: string[];
  researchHabits?: string[];
  
  // Canais e abordagem
  preferredChannels?: string[];
  marketingStrategies?: string[];
  contentTypes?: string[];
  
  // Interesses associados
  mainInterests?: string[];
  keywords?: string[];
  relatedTopics?: string[];
  
  // Gatilhos mentais
  mentalTriggers?: string[];
  psychologicalStrategies?: string[];
  
  // Segmentação para ads
  metaInterests?: string[];
  metaBehaviors?: string[];
  geographicRadius?: number;
  demographicDetails?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTemplate {
  id: string;
  sectorId: string;
  title: string;
  description: string;
  objective: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales' | 'app_installs';
  targetAudience: string;
  suggestedBudget: {
    min: number;
    max: number;
  };
  keyMessages: string[];
  creativeGuidelines: string[];
  bestPractices: string[];
  successMetrics: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectorData {
  categories: SectorCategory[];
  campaignTemplates: CampaignTemplate[];
  sectorProfiles: SectorProfile[];
}
