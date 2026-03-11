
import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

interface WhatsAppNumber {
  id: string;
  number: string;
  created_at: string;
}

// Utility function para garantir arrays seguros
const safeArray = <T>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

export const useWhatsAppHistory = () => {
  // Garantir que o estado inicial seja sempre um array válido
  const [savedNumbers, setSavedNumbers] = useState<WhatsAppNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();

  const formatWhatsAppNumber = (value: string) => {
    if (!value || typeof value !== 'string') return '';
    
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const generateWhatsAppLink = (number: string) => {
    if (!number || typeof number !== 'string') return '';
    
    const cleaned = number.replace(/\D/g, '');
    return `https://wa.me/55${cleaned}`;
  };

  const fetchSavedNumbers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching WhatsApp numbers:', error);
        // Fallback seguro - sempre manter array vazio em caso de erro
        setSavedNumbers([]);
        return;
      }

      // Proteção defensiva rigorosa - garantir que sempre seja um array válido
      const safeData = safeArray(data).filter(item => 
        item && 
        typeof item === 'object' && 
        item.id && 
        item.number &&
        typeof item.id === 'string' &&
        typeof item.number === 'string'
      );
      
      setSavedNumbers(safeData);
    } catch (error) {
      console.error('Error in fetchSavedNumbers:', error);
      // Em caso de erro, garantir que o estado seja um array vazio
      setSavedNumbers([]);
      
      toast({
        title: "Erro ao carregar números",
        description: "Não foi possível carregar a lista de números do WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  const saveNumber = useCallback(async (number: string) => {
    if (!number || typeof number !== 'string' || !number.trim()) return false;

    const formattedNumber = formatWhatsAppNumber(number);
    if (!formattedNumber) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .insert([{ number: formattedNumber }]);

      if (error) {
        // Se o erro for de duplicata, não mostrar erro
        if (error.code === '23505') {
          console.log('Number already exists, skipping...');
          return true;
        }
        throw error;
      }

      await fetchSavedNumbers();
      
      toast({
        title: "Número salvo",
        description: "Número do WhatsApp salvo com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o número do WhatsApp.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, fetchSavedNumbers]);

  const deleteNumber = useCallback(async (id: string) => {
    if (!id || typeof id === 'string') return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('whatsapp_numbers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSavedNumbers();
      
      toast({
        title: "Número removido",
        description: "Número do WhatsApp removido com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting WhatsApp number:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o número do WhatsApp.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, fetchSavedNumbers]);

  useEffect(() => {
    fetchSavedNumbers();
  }, [fetchSavedNumbers]);

  return {
    savedNumbers: safeArray(savedNumbers), // Garantir que sempre retorne um array
    isLoading,
    saveNumber,
    deleteNumber,
    fetchSavedNumbers,
    formatWhatsAppNumber,
    generateWhatsAppLink
  };
};
