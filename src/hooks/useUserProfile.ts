import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  name: string;
  email: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (formData: ProfileFormData) => {
    if (!user?.id) return false;

    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o perfil.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso.',
      });

      await loadProfile(); // Reload profile data
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível alterar a senha.',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Erro',
        description: 'Erro interno. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    updating,
    updateProfile,
    changePassword,
    loadProfile
  };
};