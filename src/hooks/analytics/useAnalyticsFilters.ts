
import { useState, useCallback } from 'react';

export interface AdvancedAnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  campaigns: string[];
  status: string;
  objective: string;
  period: string;
  budgetRange: {
    min: number;
    max: number;
  };
  performanceMetric: string;
  deviceType: string;
  platform: string;
  placement: string;
  ageRange: string;
  gender: string;
  location: string;
}

export const useAnalyticsFilters = () => {
  const [filters, setFilters] = useState<AdvancedAnalyticsFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    campaigns: [],
    status: 'all',
    objective: 'all',
    period: '30d',
    budgetRange: {
      min: 0,
      max: 10000
    },
    performanceMetric: 'all',
    deviceType: 'all',
    platform: 'all',
    placement: 'all',
    ageRange: 'all',
    gender: 'all',
    location: 'all'
  });

  const updateFilters = useCallback((newFilters: Partial<AdvancedAnalyticsFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Atualizar dateRange baseado no período
      if (newFilters.period && newFilters.period !== 'custom') {
        const days = parseInt(newFilters.period.replace('d', ''));
        updated.dateRange = {
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          to: new Date()
        };
      }
      
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      },
      campaigns: [],
      status: 'all',
      objective: 'all',
      period: '30d',
      budgetRange: {
        min: 0,
        max: 10000
      },
      performanceMetric: 'all',
      deviceType: 'all',
      platform: 'all',
      placement: 'all',
      ageRange: 'all',
      gender: 'all',
      location: 'all'
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters
  };
};
