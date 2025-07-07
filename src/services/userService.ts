import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profiles = Database['public']['Tables']['profiles']['Row'];

export const userService = {
  async updateProfile(userId: string, displayName: string): Promise<Profiles | null> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      // If the profile doesn't exist, we can't update it, but this might not be a critical error
      // depending on the flow. For now, we'll log it and continue.
      if (error.code === 'PGRST116') { // "JSON object requested, multiple (or no) rows returned"
        console.warn(`Profile not found for user ${userId}, cannot update.`);
      } else {
        throw error;
      }
    }

    // Also update the user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (metadataError) {
      console.error("Error updating user meta", metadataError);
      throw metadataError;
    }

    return data;
  },

  async getProfile(userId: string): Promise<Profiles | null> {
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
