import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { SectorProfile } from '@/types/sectors';

export const useSectorProfiles = () => {
  const supabase = useSupabase();
  const [profiles, setProfiles] = useState<SectorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sector_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProfiles = data?.map(profile => ({
        id: profile.id,
        sectorId: profile.sector_id,
        ageRangeMin: profile.age_range_min ?? undefined,
        ageRangeMax: profile.age_range_max ?? undefined,
        genderPreference: profile.gender_preference as 'male' | 'female' | 'both' | 'female_predominant' | 'male_predominant' | undefined,
        socialClass: profile.social_class ?? undefined,
        locationType: profile.location_type as 'urban' | 'suburban' | 'rural' | 'mixed' | undefined,
        locationDetails: profile.location_details ?? undefined,
        professions: profile.professions ?? undefined,
        incomeRangeMin: profile.income_range_min ?? undefined,
        incomeRangeMax: profile.income_range_max ?? undefined,
        purchaseBehaviors: profile.purchase_behaviors ?? undefined,
        decisionFactors: profile.decision_factors ?? undefined,
        priceSensitivity: profile.price_sensitivity as 'high' | 'medium' | 'low' | undefined,
        paymentPreferences: profile.payment_preferences ?? undefined,
        researchHabits: profile.research_habits ?? undefined,
        preferredChannels: profile.preferred_channels ?? undefined,
        marketingStrategies: profile.marketing_strategies ?? undefined,
        contentTypes: profile.content_types ?? undefined,
        mainInterests: profile.main_interests ?? undefined,
        keywords: profile.keywords ?? undefined,
        relatedTopics: profile.related_topics ?? undefined,
        mentalTriggers: profile.mental_triggers ?? undefined,
        psychologicalStrategies: profile.psychological_strategies ?? undefined,
        metaInterests: profile.meta_interests ?? undefined,
        metaBehaviors: profile.meta_behaviors ?? undefined,
        geographicRadius: profile.geographic_radius ?? undefined,
        demographicDetails: (profile.demographic_details as Record<string, unknown>) || {},
        createdAt: profile.created_at ?? undefined,
        updatedAt: profile.updated_at
      })) || [];

      setProfiles(formattedProfiles);
    } catch (error) {
      console.error('Error fetching sector profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<SectorProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('sector_profiles')
        .insert({
          sector_id: profileData.sectorId,
          age_range_min: profileData.ageRangeMin,
          age_range_max: profileData.ageRangeMax,
          gender_preference: profileData.genderPreference,
          social_class: profileData.socialClass,
          location_type: profileData.locationType,
          location_details: profileData.locationDetails,
          professions: profileData.professions,
          income_range_min: profileData.incomeRangeMin,
          income_range_max: profileData.incomeRangeMax,
          purchase_behaviors: profileData.purchaseBehaviors,
          decision_factors: profileData.decisionFactors,
          price_sensitivity: profileData.priceSensitivity,
          payment_preferences: profileData.paymentPreferences,
          research_habits: profileData.researchHabits,
          preferred_channels: profileData.preferredChannels,
          marketing_strategies: profileData.marketingStrategies,
          content_types: profileData.contentTypes,
          main_interests: profileData.mainInterests,
          keywords: profileData.keywords,
          related_topics: profileData.relatedTopics,
          mental_triggers: profileData.mentalTriggers,
          psychological_strategies: profileData.psychologicalStrategies,
          meta_interests: profileData.metaInterests,
          meta_behaviors: profileData.metaBehaviors,
          geographic_radius: profileData.geographicRadius,
          demographic_details: profileData.demographicDetails || {}
        })
        .select()
        .single();

      if (error) throw error;
      await fetchProfiles();
      return data;
    } catch (error) {
      console.error('Error creating sector profile:', error);
      throw error;
    }
  };

  const updateProfile = async (id: string, profileData: Partial<SectorProfile>) => {
    try {
      const { error } = await supabase
        .from('sector_profiles')
        .update({
          sector_id: profileData.sectorId,
          age_range_min: profileData.ageRangeMin,
          age_range_max: profileData.ageRangeMax,
          gender_preference: profileData.genderPreference,
          social_class: profileData.socialClass,
          location_type: profileData.locationType,
          location_details: profileData.locationDetails,
          professions: profileData.professions,
          income_range_min: profileData.incomeRangeMin,
          income_range_max: profileData.incomeRangeMax,
          purchase_behaviors: profileData.purchaseBehaviors,
          decision_factors: profileData.decisionFactors,
          price_sensitivity: profileData.priceSensitivity,
          payment_preferences: profileData.paymentPreferences,
          research_habits: profileData.researchHabits,
          preferred_channels: profileData.preferredChannels,
          marketing_strategies: profileData.marketingStrategies,
          content_types: profileData.contentTypes,
          main_interests: profileData.mainInterests,
          keywords: profileData.keywords,
          related_topics: profileData.relatedTopics,
          mental_triggers: profileData.mentalTriggers,
          psychological_strategies: profileData.psychologicalStrategies,
          meta_interests: profileData.metaInterests,
          meta_behaviors: profileData.metaBehaviors,
          geographic_radius: profileData.geographicRadius,
          demographic_details: profileData.demographicDetails || {}
        })
        .eq('id', id);

      if (error) throw error;
      await fetchProfiles();
    } catch (error) {
      console.error('Error updating sector profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sector_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProfiles();
    } catch (error) {
      console.error('Error deleting sector profile:', error);
      throw error;
    }
  };

  const getProfileBySector = (sectorId: string) => {
    return profiles.find(profile => profile.sectorId === sectorId);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileBySector,
    refetch: fetchProfiles
  };
};
