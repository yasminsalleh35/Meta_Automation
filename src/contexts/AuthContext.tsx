import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRecoveryState } from '@/hooks/useRecoveryState';
import { clearUserData } from '@/lib/clearUserData';
import { toast } from '@/hooks/use-toast';
import { accountBlockMessage, ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus';

// Limpeza de URL com tokens (sem navegar)
function cleanTokensFromURL() {
  if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState({}, document.title, url.toString());
  }
}

// ADM-02: contas suspensas pelo admin (profiles.status = 'suspended') são desconectadas.
// audit LGL-03: idem para contas com exclusão pedida (profiles.status = 'pending_deletion').
export { ACCOUNT_SUSPENDED_MESSAGE, ACCOUNT_PENDING_DELETION_MESSAGE } from '@/lib/accountStatus';

/** Mensagem de bloqueio da conta (suspensa / exclusão pedida) ou null se pode entrar. */
async function getAccountBlockMessage(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Error checking account status:', error);
    return null; // falha de leitura não derruba a sessão; o backend também bloqueia
  }
  return accountBlockMessage((data as { status?: string } | null)?.status);
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
  accountSuspended: boolean;
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
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const { isActiveRecovery } = useRecoveryState();
  const queryClient = useQueryClient();
  // Último usuário visto: troca de conta no mesmo navegador limpa os caches (audit SEC-13)
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    console.log('AuthProvider: Initializing auth state', { isActiveRecovery });
    
    // ADM-02: encerra a sessão de uma conta suspensa e avisa o usuário.
    const signOutSuspended = async (message: string) => {
      if (isMounted) setAccountSuspended(true);
      toast({
        title: message === ACCOUNT_SUSPENDED_MESSAGE ? 'Conta suspensa' : 'Conta em exclusão',
        description: message,
        variant: 'destructive',
      });
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out suspended account:', error);
      }
      clearUserData(queryClient);
      if (isMounted) {
        setUser(null);
        setSession(null);
        setMustChangePassword(false);
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session ? 'session found' : 'no session');

        const blockMessage = session?.user ? await getAccountBlockMessage(session.user.id) : null;
        if (blockMessage && isMounted) {
          await signOutSuspended(blockMessage);
        } else if (session?.user && isMounted) {
          lastUserIdRef.current = session.user.id;
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
          (event, session) => {
            if (!isMounted) return;

            console.log('Auth state changed:', event, session ? 'with session' : 'no session');

            // SEC-13: logout ou troca de usuário → limpar caches do usuário anterior
            const nextUserId = session?.user?.id ?? null;
            if (event === 'SIGNED_OUT' || (lastUserIdRef.current && nextUserId && nextUserId !== lastUserIdRef.current)) {
              clearUserData(queryClient);
            }
            lastUserIdRef.current = nextUserId;

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
              setAccountSuspended(false);

              // ADM-02: conta suspensa → sair (fora do callback, ver PLT-08)
              const suspendedCheckUid = session.user.id;
              setTimeout(async () => {
                const blockMessage = isMounted ? await getAccountBlockMessage(suspendedCheckUid) : null;
                if (isMounted && blockMessage) {
                  await signOutSuspended(blockMessage);
                }
              }, 0);

              // Durante recovery, não forçar mudança de senha
              if (isActiveRecovery) {
                console.log('AuthProvider: Recovery flow in listener, skipping password change requirement');
                setMustChangePassword(false);
              } else {
                // Verificar se precisa trocar senha apenas fora do recovery.
                // Fora do callback (setTimeout): chamadas Supabase aguardadas dentro de
                // onAuthStateChange podem travar o cliente (audit PLT-08).
                const uid = session.user.id;
                setTimeout(async () => {
                  try {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('must_change_password')
                      .eq('id', uid)
                      .single();
                    if (isMounted) setMustChangePassword(profile?.must_change_password || false);
                  } catch (error) {
                    console.error('Error fetching profile:', error);
                  }
                }, 0);
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
  }, [isActiveRecovery, queryClient]);

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    // ADM-02 / LGL-03: conta suspensa ou com exclusão pedida não entra
    const blockMessage = data?.user ? await getAccountBlockMessage(data.user.id) : null;
    if (blockMessage) {
      await supabase.auth.signOut();
      setAccountSuspended(true);
      throw new Error(blockMessage);
    }
    setAccountSuspended(false);

    console.log('Login successful');
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
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
    
    console.log('Registration successful');
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
    } catch (error: unknown) {
      console.error('Logout: Error during signOut:', error);
      throw error;
    } finally {
      // Sempre limpa estado local e caches do usuário (audit SEC-13)
      clearUserData(queryClient);
      lastUserIdRef.current = null;
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
    accountSuspended,
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

/**
 * audit SEC-13: id do usuário logado para compor chaves de cache (React Query / metaCache).
 * Não lança fora do AuthProvider (testes de hooks isolados) — retorna null.
 */
export const useOptionalUserId = (): string | null => useContext(AuthContext)?.user?.id ?? null;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 🔒 FASE 2: Hook removido - lógica consolidada no AuthProvider
