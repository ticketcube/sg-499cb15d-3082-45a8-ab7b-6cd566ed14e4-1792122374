
    import { supabase } from "@/integrations/supabase/client";

    export const getUser = async () => {
      const {  { user } } = await supabase.auth.getUser();
      return user;
    };

    export const signIn = async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    };

    export const signUp = async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
           {
            display_name: displayName
          }
        }
      });
      if (error) throw error;
      return data;
    };

    export const signOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    };
  