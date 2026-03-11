
import { UserRole, RoleCache } from '@/types/userRole';

const ROLE_CACHE_KEY = 'user_role_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getCachedRole = (userId: string): UserRole | null => {
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    
    if (cached) {
      const cacheData: RoleCache = JSON.parse(cached);
      
      // Verificar se o cache é válido e do mesmo usuário
      if (
        cacheData.userId === userId &&
        Date.now() - cacheData.timestamp < CACHE_DURATION
      ) {
        console.log('useUserRole: Using cached role:', cacheData.role);
        return cacheData.role;
      } else {
        // Cache expirado ou usuário diferente, limpar
        localStorage.removeItem(ROLE_CACHE_KEY);
        console.log('useUserRole: Cache expired or different user, clearing');
      }
    }
  } catch (error) {
    console.error('useUserRole: Error reading role cache:', error);
    // Limpar cache corrompido
    localStorage.removeItem(ROLE_CACHE_KEY);
  }
  
  return null;
};

export const setCachedRole = (role: UserRole, userId: string) => {
  try {
    const cacheData: RoleCache = {
      role,
      userId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('useUserRole: Cached role:', role, 'for user:', userId);
  } catch (error) {
    console.error('useUserRole: Error setting role cache:', error);
  }
};

export const clearRoleCache = () => {
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
    console.log('useUserRole: Cache cleared');
  } catch (error) {
    console.error('useUserRole: Error clearing role cache:', error);
  }
};

// Função para verificar se o cache é válido
export const isCacheValid = (userId: string): boolean => {
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    
    if (cached) {
      const cacheData: RoleCache = JSON.parse(cached);
      return (
        cacheData.userId === userId &&
        Date.now() - cacheData.timestamp < CACHE_DURATION
      );
    }
  } catch (error) {
    console.error('useUserRole: Error checking cache validity:', error);
  }
  
  return false;
};
