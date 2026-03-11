
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealMetrics } from '@/hooks/useRealMetrics';

interface DateRange {
  from: Date;
  to: Date;
}

export const useOptimizedMetrics = (initialDateRange: DateRange) => {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { metrics, loading, error } = useRealMetrics(dateRange);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setIsChangingDate(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the date range change to avoid rapid API calls
    timeoutRef.current = setTimeout(() => {
      setDateRange(range);
      setIsChangingDate(false);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    metrics,
    loading: loading || isChangingDate,
    error,
    dateRange,
    handleDateRangeChange
  };
};
