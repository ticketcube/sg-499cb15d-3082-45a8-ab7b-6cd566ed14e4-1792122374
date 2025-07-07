
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const userService = {
  async updateProfile(userId: string, displayName: string): Promise<Profile | null> {
    const {  profileData, error: profileError } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", profileError);
      if (profileError.code === 'PGRST116') { // "JSON object requested, multiple (or no) rows returned"
        console.warn(`Profile not found for user ${userId}, cannot update.`);
      } else {
        throw profileError;
      }
    }

    // Also update the user metadata in Supabase Auth.
    // The 'data' property is used for user_metadata.
    const { error: metadataError } = await supabase.auth.updateUser({
       { display_name: displayName }
    });

    if (metadataError) {
      console.error("Error updating user meta", metadataError);
      throw metadataError;
    }

    return profileData;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No profile found for user ${userId}. A new one may need to be created.`);
        return null;
      }
      console.error("Error fetching profile:", error);
      throw error;
    }

    return data;
  }
};
