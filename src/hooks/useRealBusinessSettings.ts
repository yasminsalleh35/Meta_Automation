
import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

export interface BusinessSetting {
  id: string;
  user_id: string;
  business_name: string | null;
  business_description: string | null;
  main_product: string | null;
  category: string | null;
  target_audience: string | null;
  business_goals: string | null;
  created_at: string;
  updated_at: string;
}

export const useRealBusinessSettings = () => {
  const [businesses, setBusinesses] = useState<BusinessSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  const { toast } = useToast();

  const loadBusinesses = async (filters?: { category?: string; search?: string }) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('business_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,business_description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar negócios');
    } finally {
      setIsLoading(false);
    }
  };

  const getBusinessStats = () => {
    const totalBusinesses = businesses.length;
    const categories = [...new Set(businesses.map(b => b.category).filter(Boolean))];
    const recentBusinesses = businesses.filter(b => {
      const createdDate = new Date(b.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length;
    
    const categoryCounts = categories.reduce((acc, category) => {
      acc[category] = businesses.filter(b => b.category === category).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBusinesses,
      totalCategories: categories.length,
      recentBusinesses,
      categoryCounts
    };
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  return {
    businesses,
    isLoading,
    error,
    loadBusinesses,
    getBusinessStats
  };
};
