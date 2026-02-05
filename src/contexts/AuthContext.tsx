import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      console.log("[AuthContext] Refreshing profile...");
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log("[AuthContext] Current session:", currentSession ? "exists" : "none");
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", currentSession.user.id)
          .single();

        console.log("[AuthContext] Profile fetch result:", { hasData: !!data, error });

        if (!error && data) {
          setProfile(data as Profile);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("[AuthContext] Error refreshing profile:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log("[AuthContext] Initial session:", initialSession ? "exists" : "none");
        
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", initialSession.user.id)
            .single();
            
          if (mounted && profileData) {
            setProfile(profileData as Profile);
          }
        }
      } catch (error) {
        console.error("[AuthContext] Auth init error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[AuthContext] Auth state change:", event, newSession ? "has session" : "no session");
      
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !newSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(newSession);
        setUser(newSession.user);
        
        try {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", newSession.user.id)
            .single();
            
          if (mounted && profileData) {
            setProfile(profileData as Profile);
          }
        } catch (error) {
          console.error("[AuthContext] Profile fetch error:", error);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);