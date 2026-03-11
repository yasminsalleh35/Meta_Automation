import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export interface NormalizedSelection {
  primaryPageId: string | null;
  primaryInstagramId: string | null;
  primaryAdAccountId: string | null;
  allPageIds: string[];
  allInstagramIds: string[];
  allAdAccountIds: string[];
}

export const useNormalizedMetaSelection = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [selection, setSelection] = useState<NormalizedSelection | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSelection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-selection', {
        method: 'GET'
      });

      if (error) {
        throw error;
      }

      if (data?.selection) {
        setSelection(data.selection);
      }
    } catch (error) {
      console.error('Error fetching normalized meta selection:', error);
      toast({
        title: "Erro ao buscar seleção",
        description: "Não foi possível buscar suas seleções de Facebook e Instagram.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelection();
  }, []);

  return {
    selection,
    loading,
    refetch: fetchSelection
  };
};