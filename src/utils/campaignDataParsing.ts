
import { Json } from '@/integrations/supabase/types';

// Helper function to safely parse JSONB arrays to string arrays
export const parseJsonArray = (value: Json | null, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  
  // If it's already an array
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string') as string[];
  }
  
  // If it's a string (JSON), try to parse it
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
    } catch (error) {
      console.warn('Failed to parse JSON array:', error);
    }
  }
  
  return defaultValue;
};
