
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
  
  // PERFORMANCE FIX #1: Use ref to track active requests and prevent race conditions
  const activeRequestRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);

  // PERFORMANCE FIX #2: Memoized profile fetcher with request cancellation
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh = false) => {
    try {
      // Cancel any existing profile request
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      // Create new request controller
      const controller = new AbortController();
      activeRequestRef.current = controller;

      // Use cached profile if available and not forcing refresh
      if (!forceRefresh && profile && profile.id === userId) {
        return profile;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      // Check if request was cancelled
      if (controller.signal.aborted) {
        return null;
      }

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      const profileData = data as Profile;
      setProfile(profileData);
      return profileData;
    } catch (error: any) {
      // Ignore aborted requests
      if (error?.name === 'AbortError') {
        return null;
      }
      console.error('Error in fetchUserProfile:', error);
      return null;
    } finally {
      // Clear the active request reference
      if (activeRequestRef.current) {
        activeRequestRef.current = null;
      }
    }
  }, [profile]);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, true);
    }
  };

  // PERFORMANCE FIX #3: Clear all cached data and cancel requests on logout
  const clearAuthState = useCallback(() => {
    // Cancel any active requests
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
    
    // Clear all state
    setSession(null);
    setUser(null);
    setProfile(null);
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
        // PERFORMANCE FIX #4: Clear state on initialization error
        clearAuthState();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // PERFORMANCE FIX #5: Simplified auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      // Handle sign out specifically
      if (event === 'SIGNED_OUT') {
        clearAuthState();
        return;
      }

      // Handle sign in
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
      // Cancel any active requests when component unmounts
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
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
