import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMetaInterestSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ id: string; name: string; audience_size?: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('meta-targeting-search', {
        body: { q },
      });
      
      if (error) throw error;
      
      if (data?.items && Array.isArray(data.items)) {
        setResults(data.items);
      } else if (data?.interests && Array.isArray(data.interests)) {
        // Legacy compatibility
        setResults(data.interests);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (e) {
      // Fallback: não quebra a UI, apenas informa que a busca não está disponível
      setError(e instanceof Error ? e.message : 'Falha na busca');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, results, error, search };
}