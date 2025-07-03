
    import { createContext, useContext, useEffect, useState, ReactNode } from "react";
    import { supabase } from "@/services/supabase";
    import { Session, User } from "@supabase/supabase-js";
    import { signUp as supabaseSignUp, signIn as supabaseSignIn, signOut as supabaseSignOut } from "@/services/supabase";

    interface AuthContextType {
      user: User | null;
      session: Session | null;
      loading: boolean;
      login: (email: string, password: string) => Promise<any>;
      register: (email: string, password: string, displayName: string) => Promise<any>;
      logout: () => Promise<void>;
    }

    const AuthContext = createContext<AuthContextType>({
      user: null,
      session: null,
      loading: true,
      login: async () => {},
      register: async () => {},
      logout: async () => {}
    });

    export function AuthProvider({ children }: { children: ReactNode }) {
      const [user, setUser] = useState<User | null>(null);
      const [session, setSession] = useState<Session | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const getSession = async () => {
          const {  { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        };

        getSession();

        const {  { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        });

        return () => {
          subscription.unsubscribe();
        };
      }, []);

      const login = async (email: string, password: string) => {
        return await supabaseSignIn(email, password);
      };

      const register = async (email: string, password: string, displayName: string) => {
        return await supabaseSignUp(email, password, displayName);
      };

      const logout = async () => {
        await supabaseSignOut();
      };

      const value = {
        user,
        session,
        loading,
        login,
        register,
        logout,
      };

      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    }

    export const useAuth = () => useContext(AuthContext);
  