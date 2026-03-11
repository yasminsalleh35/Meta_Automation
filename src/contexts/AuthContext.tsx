import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useRecoveryState } from '@/hooks/useRecoveryState';

// Limpeza de URL com tokens (sem navegar)
function cleanTokensFromURL() {
  if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState({}, document.title, url.toString());
  }
}

export interface AuthUser extends User {
  name?: string;
  subscription?: {
    plan: string;
    active: boolean;
    subscriptionEnd?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const { isActiveRecovery } = useRecoveryState();

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;
    
    console.log('AuthProvider: Initializing auth state', { isActiveRecovery });
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session ? 'session found' : 'no session');
        
        if (session?.user && isMounted) {
          const authUser: AuthUser = {
            ...session.user,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            subscription: {
              plan: 'basic',
              active: false
            }
          };
          setUser(authUser);
          setSession(session);
          
          // Durante recovery, não forçar mudança de senha
          if (isActiveRecovery) {
            console.log('AuthProvider: Recovery flow detected, skipping password change requirement');
            setMustChangePassword(false);
          } else {
            // Verificar se precisa trocar senha apenas fora do recovery
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('must_change_password')
                .eq('id', session.user.id)
                .single();
              
              const needsPasswordChange = profile?.must_change_password || false;
              setMustChangePassword(needsPasswordChange);
            } catch (error) {
              console.error('Error fetching profile on initial check:', error);
            }
          }
          
          cleanTokensFromURL();
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }

      // 🔒 FASE 3: Configurar listener APÓS verificação inicial
      if (isMounted) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            console.log('Auth state changed:', event, session ? 'with session' : 'no session');
            
            setSession(session);
            if (session?.user) {
              console.log('User logged in');
              const authUser: AuthUser = {
                ...session.user,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                subscription: {
                  plan: 'basic',
                  active: false
                }
              };
              setUser(authUser);
              
              // Durante recovery, não forçar mudança de senha
              if (isActiveRecovery) {
                console.log('AuthProvider: Recovery flow in listener, skipping password change requirement');
                setMustChangePassword(false);
              } else {
                // Verificar se precisa trocar senha apenas fora do recovery
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('must_change_password')
                    .eq('id', session.user.id)
                    .single();
                  
                  const needsPasswordChange = profile?.must_change_password || false;
                  setMustChangePassword(needsPasswordChange);
                } catch (error) {
                  console.error('Error fetching profile:', error);
                }
              }
              
              cleanTokensFromURL();
            } else {
              console.log('User logged out');
              setUser(null);
              setMustChangePassword(false);
            }
          }
        );
        
        authSubscription = subscription;
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [isActiveRecovery]);

  const login = async (email: string, password: string): Promise<void> => {
    console.log('AuthContext: Attempting login for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Login successful for:', email);
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    console.log('AuthContext: Attempting registration for:', email);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) {
      console.error('Registration error:', error);
      throw error;
    }
    
    console.log('Registration successful for:', email);
  };

  const logout = async (): Promise<void> => {
    console.log('AuthContext: Iniciando logout');
    
    try {
      // Sempre tenta fazer signOut, independente do estado local da sessão
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      console.log('Logout: SignOut successful');
    } catch (error: any) {
      console.error('Logout: Error during signOut:', error);
      throw error;
    } finally {
      // Sempre limpa estado local
      setUser(null);
      setSession(null);
      setMustChangePassword(false);
      console.log('Logout: Local state cleared');
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    loading,
    mustChangePassword,
    login,
    register,
    logout
  };

  console.log('AuthProvider: Current state - loading:', loading, 'isAuthenticated:', !!user);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 🔒 FASE 2: Hook removido - lógica consolidada no AuthProvider
