
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UseUserRoleReturn {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  refetchRole: () => Promise<void>;
}

export interface RoleCache {
  role: UserRole;
  userId: string;
  timestamp: number;
}
