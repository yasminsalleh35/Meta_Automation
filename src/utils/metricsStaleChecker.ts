/**
 * Utilities for checking if campaign metrics are stale
 */

export const isMetricsStale = (last_sync: string | null | undefined, thresholdMinutes = 60): boolean => {
  if (!last_sync) return true;
  
  const diffMinutes = (Date.now() - new Date(last_sync).getTime()) / (1000 * 60);
  return diffMinutes > thresholdMinutes;
};

export const getLastSyncLabel = (last_sync: string | null | undefined): string => {
  if (!last_sync) return 'Nunca sincronizado';
  
  const diffMinutes = Math.floor((Date.now() - new Date(last_sync).getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
};

export const getMetricsStaleColor = (last_sync: string | null | undefined): string => {
  if (!last_sync) return 'text-red-600';
  
  const diffMinutes = (Date.now() - new Date(last_sync).getTime()) / (1000 * 60);
  
  if (diffMinutes < 30) return 'text-green-600';
  if (diffMinutes < 60) return 'text-yellow-600';
  return 'text-red-600';
};
