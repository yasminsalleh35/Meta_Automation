
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { metaAdsService } from '@/services/metaAdsService';

export const useMetaAdsCreativeManagement = (connection: any) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const checkCreativeInstagram = async (creativeId: string) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    try {
      return await metaAdsService.checkCreativeInstagram(creativeId, connection.accessToken);
    } catch (error) {
      console.error('Error checking creative Instagram:', error);
      throw error;
    }
  };

  const updateCreativeInstagram = async (creativeId: string, instagramId: string) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    setIsLoading(true);
    try {
      const result = await metaAdsService.updateCreativeInstagram(
        creativeId,
        instagramId,
        connection.accessToken
      );
      
      if (result) {
        toast({
          title: "Instagram atualizado",
          description: "O Instagram foi atualizado com sucesso no criativo.",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating creative Instagram:', error);
      toast({
        title: "Erro ao atualizar Instagram",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCreativeDetails = async (creativeId: string) => {
    if (!connection.accessToken) {
      throw new Error('Access token não disponível');
    }

    try {
      return await metaAdsService.getCreativeDetails(creativeId, connection.accessToken);
    } catch (error) {
      console.error('Error fetching creative details:', error);
      throw error;
    }
  };

  return {
    checkCreativeInstagram,
    updateCreativeInstagram,
    getCreativeDetails,
    isLoading
  };
};
