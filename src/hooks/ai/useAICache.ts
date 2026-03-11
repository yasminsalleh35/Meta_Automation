
import { useState } from 'react';
import { aiCacheService } from '@/services/aiCacheService';
import { openaiService } from '@/services/openaiService';

export const useAICache = () => {
  // Carregar cache na inicialização
  useState(() => {
    aiCacheService.loadFromStorage();
  });

  const getCachedSuggestions = async (objective: string) => {
    try {
      const businessData = await openaiService.getBusinessData();
      return aiCacheService.get(objective, businessData);
    } catch (error) {
      console.warn('Erro ao verificar cache:', error);
      return null;
    }
  };

  const saveSuggestionsToCache = async (objective: string, suggestions: any) => {
    try {
      const businessData = await openaiService.getBusinessData();
      aiCacheService.set(objective, businessData, suggestions, 24); // 24 horas de cache
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  };

  const getCacheStats = () => {
    return aiCacheService.getStats();
  };

  return {
    getCachedSuggestions,
    saveSuggestionsToCache,
    getCacheStats
  };
};
