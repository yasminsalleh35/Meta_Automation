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
      
      // audit DATA-07: profiles.email não é editável pelo usuário (trigger
      // profiles_guard_protected_columns). A troca de e-mail passa pelo Auth, que
      // exige confirmação; profiles.email é sincronizado a partir de auth.users.
      const newEmail = formData.email?.trim();
      const emailChanged = !!newEmail && newEmail.toLowerCase() !== (profile?.email || user.email || '').toLowerCase();

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (!error && emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) {
          console.error('Error requesting email change:', emailError);
          toast({
            title: 'Erro',
            description: 'Nome salvo, mas não foi possível solicitar a troca de e-mail.',
            variant: 'destructive'
          });
          await loadProfile();
          return false;
        }
        toast({
          title: 'Confirme o novo e-mail',
          description: 'Enviamos um link de confirmação. O e-mail será atualizado após a confirmação.',
        });
        await loadProfile();
        return true;
      }

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