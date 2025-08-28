
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  
  // PERFORMANCE FIX: Track initialization and prevent duplicate requests
  const isInitializedRef = useRef(false);
  const lastProfileFetchRef = useRef<string | null>(null);
  const profilePromiseRef = useRef<Promise<Profile | null> | null>(null);

  // PERFORMANCE FIX: Memoized profile fetcher with better error handling
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh = false) => {
    try {
      // Prevent duplicate requests for same user
      if (!forceRefresh && lastProfileFetchRef.current === userId && profile?.id === userId) {
        return profile;
      }

      // Return existing promise if one is already in flight for this user
      if (!forceRefresh && profilePromiseRef.current && lastProfileFetchRef.current === userId) {
        return profilePromiseRef.current;
      }

      // Create new profile fetch promise
      const profilePromise = (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }

        const profileData = data as Profile;
        setProfile(profileData);
        return profileData;
      })();

      // Cache the promise and user ID
      profilePromiseRef.current = profilePromise;
      lastProfileFetchRef.current = userId;

      const result = await profilePromise;
      
      // Clear the promise cache after completion
      if (profilePromiseRef.current === profilePromise) {
        profilePromiseRef.current = null;
      }

      return result;
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      
      // Clear cache on error
      if (lastProfileFetchRef.current === userId) {
        profilePromiseRef.current = null;
      }
      
      return null;
    }
  }, [profile]);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, true);
    }
  };

  // PERFORMANCE FIX: Clear all cached data on logout
  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    lastProfileFetchRef.current = null;
    profilePromiseRef.current = null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Prevent multiple initializations
        if (isInitializedRef.current) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // PERFORMANCE FIX: Simplified auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      // Handle sign out specifically
      if (event === 'SIGNED_OUT') {
        clearAuthState();
        return;
      }

      // Handle sign in/token refresh
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Only fetch profile if it's a different user or we don't have one
        if (!profile || profile.id !== session.user.id) {
          await fetchUserProfile(session.user.id);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, clearAuthState, profile]);

  const login = async (email: string, password: string) => {
    try {
      const result = await supabaseSignIn(email, password);
      
      if (result.user) {
        // Profile will be loaded by onAuthStateChange handler
        // No need to manually fetch here to avoid race conditions
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const result = await supabaseSignUp(email, password, displayName);
      
      if (result.user) {
        // Profile will be loaded by onAuthStateChange handler
        // No need to manually fetch here to avoid race conditions
      }
      
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
      // clearAuthState will be called by onAuthStateChange handler
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear state even if logout fails
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
