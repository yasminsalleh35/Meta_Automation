
import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@/types/userRole';

export const fetchUserRoleFromAPI = async (
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> => {
  console.log('useUserRole: Fetching user role from database');

  // Query direta na tabela user_roles com timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), 5000);
  });

  const fetchPromise = supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .order('role', { ascending: false }); // super_admin vem antes de admin, admin antes de user

  const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

  if (error) {
    console.error('useUserRole: Error fetching user role:', error);
    throw new Error('Erro ao verificar permissões do usuário');
  }

  // Pegar o role de maior privilégio (primeiro na lista ordenada)
  const userRole = (data?.[0]?.role as UserRole) || 'user';
  console.log('useUserRole: Role received from database:', userRole);
  return userRole;
};
