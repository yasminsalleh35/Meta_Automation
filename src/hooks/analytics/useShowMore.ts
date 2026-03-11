
import { useState, useMemo } from 'react';

interface UseShowMoreProps<T> {
  data: T[];
  initialCount: number;
  incrementCount?: number;
}

export const useShowMore = <T>({ 
  data, 
  initialCount, 
  incrementCount = initialCount 
}: UseShowMoreProps<T>) => {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleData = useMemo(() => {
    return data.slice(0, visibleCount);
  }, [data, visibleCount]);

  const showMore = () => {
    setVisibleCount(prev => Math.min(prev + incrementCount, data.length));
  };

  const showLess = () => {
    setVisibleCount(initialCount);
  };

  const showAll = () => {
    setVisibleCount(data.length);
  };

  const resetCount = () => {
    setVisibleCount(initialCount);
  };

  return {
    visibleData,
    visibleCount,
    showMore,
    showLess,
    showAll,
    resetCount,
    hasMore: visibleCount < data.length,
    isShowingAll: visibleCount >= data.length,
    totalItems: data.length,
    remainingItems: Math.max(0, data.length - visibleCount)
  };
};
