
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { signUp as supabaseSignUp, signIn as supabaseSignIn, signOut as supabaseSignOut } from "@/services/supabase";
import { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; }>;
  register: (email: string, password: string, displayName: string) => Promise<{ user: User | null; session: Session | null; }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  login: async () => ({ user: null, session: null }),
  register: async () => ({ user: null, session: null }),
  logout: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // SIMPLIFIED: Basic profile fetch without caching or promises
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        return null;
      }

      const profileData = data as Profile;
      setProfile(profileData);
      return profileData;
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      setProfile(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  // SIMPLIFIED: Clear state function
  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    let isMounted = true;

    // SIMPLIFIED: Initialize auth without complex state management
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          if (currentSession.user?.id) {
            await fetchUserProfile(currentSession.user.id);
          }
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // SIMPLIFIED: Basic auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log('Auth event:', event);

      if (event === 'SIGNED_OUT' || !newSession) {
        clearAuthState();
      } else {
        setSession(newSession);
        setUser(newSession.user);
        
        if (newSession.user?.id) {
          await fetchUserProfile(newSession.user.id);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove all dependencies to prevent re-runs

  const login = async (email: string, password: string) => {
    try {
      const result = await supabaseSignIn(email, password);
      // Auth state change will handle profile loading
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const result = await supabaseSignUp(email, password, displayName);
      // Auth state change will handle profile loading
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
      // Auth state change will handle clearing state
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear on error
      clearAuthState();
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
