
import { useState, useEffect } from 'react';
import { SectorData, SectorCategory, SectorSpecialization, CampaignTemplate } from '@/types/sectors';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSectorProfiles } from './useSectorProfiles';

export const useSectorData = () => {
  const { profiles } = useSectorProfiles();
  const { toast } = useToast();
  const [sectorData, setSectorData] = useState<SectorData>({
    categories: [],
    campaignTemplates: [],
    sectorProfiles: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  const fetchSectorData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories with specializations
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('sector_categories')
        .select(`
          id,
          name,
          description,
          sector_specializations (
            id,
            category_id,
            name,
            description
          )
        `)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Transform data to match SectorCategory interface
      const categories: SectorCategory[] = categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        specializations: cat.sector_specializations?.map((spec: any) => ({
          id: spec.id,
          categoryId: spec.category_id,
          name: spec.name,
          description: spec.description || ''
        })) || []
      })) || [];

      // Fetch campaign templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (templatesError) throw templatesError;

      const campaignTemplates: CampaignTemplate[] = templatesData?.map(template => ({
        id: template.id,
        sectorId: template.sector_id,
        title: template.title,
        description: template.description,
        objective: template.objective as any,
        targetAudience: template.target_audience,
        suggestedBudget: {
          min: Number(template.suggested_budget_min),
          max: Number(template.suggested_budget_max)
        },
        keyMessages: template.key_messages || [],
        creativeGuidelines: template.creative_guidelines || [],
        bestPractices: template.best_practices || [],
        successMetrics: template.success_metrics || [],
        isActive: template.is_active,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      })) || [];

      setSectorData({
        categories,
        campaignTemplates,
        sectorProfiles: profiles
      });

    } catch (error) {
      console.error('Error fetching sector data:', error);
      toast({
        title: "Erro ao carregar setores",
        description: "Não foi possível carregar os dados dos setores.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const actions = {
    addCategory: async (category: Omit<SectorCategory, 'id' | 'specializations'>) => {
      try {
        const { data, error } = await supabase
          .from('sector_categories')
          .insert([{ name: category.name, description: category.description }])
          .select()
          .single();

        if (error) throw error;

        const newCategory: SectorCategory = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          specializations: []
        };

        setSectorData(prev => ({
          ...prev,
          categories: [...prev.categories, newCategory]
        }));

        toast({
          title: "Categoria criada",
          description: "A categoria foi criada com sucesso.",
        });
      } catch (error) {
        console.error('Error adding category:', error);
        toast({
          title: "Erro ao criar categoria",
          description: "Não foi possível criar a categoria.",
          variant: "destructive"
        });
      }
    },

    updateCategory: async (id: string, updates: Partial<SectorCategory>) => {
      try {
        const { error } = await supabase
          .from('sector_categories')
          .update({ 
            name: updates.name, 
            description: updates.description 
          })
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          categories: prev.categories.map(cat => 
            cat.id === id ? { ...cat, ...updates } : cat
          )
        }));

        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Error updating category:', error);
        toast({
          title: "Erro ao atualizar categoria",
          description: "Não foi possível atualizar a categoria.",
          variant: "destructive"
        });
      }
    },

    deleteCategory: async (id: string) => {
      try {
        const { error } = await supabase
          .from('sector_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          categories: prev.categories.filter(cat => cat.id !== id)
        }));

        toast({
          title: "Categoria excluída",
          description: "A categoria foi excluída com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting category:', error);
        toast({
          title: "Erro ao excluir categoria",
          description: "Não foi possível excluir a categoria.",
          variant: "destructive"
        });
      }
    },

    addSpecialization: async (specialization: Omit<SectorSpecialization, 'id'>) => {
      try {
        const { data, error } = await supabase
          .from('sector_specializations')
          .insert([{
            category_id: specialization.categoryId,
            name: specialization.name,
            description: specialization.description
          }])
          .select()
          .single();

        if (error) throw error;

        const newSpecialization: SectorSpecialization = {
          id: data.id,
          categoryId: data.category_id,
          name: data.name,
          description: data.description || ''
        };

        setSectorData(prev => ({
          ...prev,
          categories: prev.categories.map(cat => {
            if (cat.id === specialization.categoryId) {
              return {
                ...cat,
                specializations: [...cat.specializations, newSpecialization]
              };
            }
            return cat;
          })
        }));

        toast({
          title: "Especialização criada",
          description: "A especialização foi criada com sucesso.",
        });
      } catch (error) {
        console.error('Error adding specialization:', error);
        toast({
          title: "Erro ao criar especialização",
          description: "Não foi possível criar a especialização.",
          variant: "destructive"
        });
      }
    },

    updateSpecialization: async (id: string, updates: Partial<SectorSpecialization>) => {
      try {
        const { error } = await supabase
          .from('sector_specializations')
          .update({
            name: updates.name,
            description: updates.description
          })
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            specializations: cat.specializations.map(spec => 
              spec.id === id ? { ...spec, ...updates } : spec
            )
          }))
        }));

        toast({
          title: "Especialização atualizada",
          description: "A especialização foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Error updating specialization:', error);
        toast({
          title: "Erro ao atualizar especialização",
          description: "Não foi possível atualizar a especialização.",
          variant: "destructive"
        });
      }
    },

    deleteSpecialization: async (id: string) => {
      try {
        const { error } = await supabase
          .from('sector_specializations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            specializations: cat.specializations.filter(spec => spec.id !== id)
          }))
        }));

        toast({
          title: "Especialização excluída",
          description: "A especialização foi excluída com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting specialization:', error);
        toast({
          title: "Erro ao excluir especialização",
          description: "Não foi possível excluir a especialização.",
          variant: "destructive"
        });
      }
    },

    addCampaignTemplate: async (template: Omit<CampaignTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const { data, error } = await supabase
          .from('campaign_templates')
          .insert([{
            sector_id: template.sectorId,
            title: template.title,
            description: template.description,
            objective: template.objective,
            target_audience: template.targetAudience,
            suggested_budget_min: template.suggestedBudget.min,
            suggested_budget_max: template.suggestedBudget.max,
            key_messages: template.keyMessages,
            creative_guidelines: template.creativeGuidelines,
            best_practices: template.bestPractices,
            success_metrics: template.successMetrics,
            is_active: template.isActive
          }])
          .select()
          .single();

        if (error) throw error;

        const newTemplate: CampaignTemplate = {
          id: data.id,
          sectorId: data.sector_id,
          title: data.title,
          description: data.description,
          objective: data.objective,
          targetAudience: data.target_audience,
          suggestedBudget: {
            min: Number(data.suggested_budget_min),
            max: Number(data.suggested_budget_max)
          },
          keyMessages: data.key_messages || [],
          creativeGuidelines: data.creative_guidelines || [],
          bestPractices: data.best_practices || [],
          successMetrics: data.success_metrics || [],
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        setSectorData(prev => ({
          ...prev,
          campaignTemplates: [...prev.campaignTemplates, newTemplate]
        }));

        toast({
          title: "Template criado",
          description: "O template de campanha foi criado com sucesso.",
        });
      } catch (error) {
        console.error('Error adding campaign template:', error);
        toast({
          title: "Erro ao criar template",
          description: "Não foi possível criar o template de campanha.",
          variant: "destructive"
        });
      }
    },

    updateCampaignTemplate: async (id: string, updates: Partial<CampaignTemplate>) => {
      try {
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.objective !== undefined) updateData.objective = updates.objective;
        if (updates.targetAudience !== undefined) updateData.target_audience = updates.targetAudience;
        if (updates.suggestedBudget !== undefined) {
          updateData.suggested_budget_min = updates.suggestedBudget.min;
          updateData.suggested_budget_max = updates.suggestedBudget.max;
        }
        if (updates.keyMessages !== undefined) updateData.key_messages = updates.keyMessages;
        if (updates.creativeGuidelines !== undefined) updateData.creative_guidelines = updates.creativeGuidelines;
        if (updates.bestPractices !== undefined) updateData.best_practices = updates.bestPractices;
        if (updates.successMetrics !== undefined) updateData.success_metrics = updates.successMetrics;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

        const { error } = await supabase
          .from('campaign_templates')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          campaignTemplates: prev.campaignTemplates.map(template => 
            template.id === id ? { ...template, ...updates, updatedAt: new Date().toISOString() } : template
          )
        }));

        toast({
          title: "Template atualizado",
          description: "O template de campanha foi atualizado com sucesso.",
        });
      } catch (error) {
        console.error('Error updating campaign template:', error);
        toast({
          title: "Erro ao atualizar template",
          description: "Não foi possível atualizar o template de campanha.",
          variant: "destructive"
        });
      }
    },

    deleteCampaignTemplate: async (id: string) => {
      try {
        const { error } = await supabase
          .from('campaign_templates')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setSectorData(prev => ({
          ...prev,
          campaignTemplates: prev.campaignTemplates.filter(template => template.id !== id)
        }));

        toast({
          title: "Template excluído",
          description: "O template de campanha foi excluído com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting campaign template:', error);
        toast({
          title: "Erro ao excluir template",
          description: "Não foi possível excluir o template de campanha.",
          variant: "destructive"
        });
      }
    },

    getCampaignsBySector: (sectorId: string) => {
      return sectorData.campaignTemplates.filter(template => template.sectorId === sectorId);
    }
  };

  useEffect(() => {
    fetchSectorData();
  }, []);

  useEffect(() => {
    setSectorData(prev => ({
      ...prev,
      sectorProfiles: profiles
    }));
  }, [profiles]);

  return {
    sectorData: {
      ...sectorData,
      sectorProfiles: profiles
    },
    loading,
    actions,
    refetch: fetchSectorData
  };
};
