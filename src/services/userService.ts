import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const userService = {
  async updateProfile(userId: string, displayName: string): Promise<Profile | null> {
    // First try to get the profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert([{ 
          id: userId,
          display_name: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        throw createError;
      }

      // Update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (metadataError) {
        console.error("Error updating user auth metadata", metadataError);
        throw metadataError;
      }

      return newProfile;
    }

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      throw fetchError;
    }

    // Profile exists, update it
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    // Update auth metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (metadataError) {
      console.error("Error updating user auth metadata", metadataError);
      throw metadataError;
    }

    return updatedProfile;
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
