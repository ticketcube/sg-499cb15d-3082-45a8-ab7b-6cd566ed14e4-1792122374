import { supabase } from "@/integrations/supabase/client";

// The auto-generated Database type from Supabase seems to be out of sync and is missing the 'profiles' table.
// We are defining a local interface for a Profile to bypass the resulting TypeScript errors.
// This ensures the application can compile while still providing some type safety for profile objects.
interface Profile {
  id: string;
  display_name: string;
  updated_at: string;
}

export const userService = {
  async updateProfile(userId: string, displayName: string): Promise<Profile | null> {
    // @ts-expect-error - This is necessary because the auto-generated Supabase types are missing the 'profiles' table.
    const { data: profileData, error: profileError } = await supabase
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
      data: { display_name: displayName }
    });

    if (metadataError) {
      console.error("Error updating user meta", metadataError);
      throw metadataError;
    }

    return profileData;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    // @ts-expect-error - This is necessary because the auto-generated Supabase types are missing the 'profiles' table.
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

    return data as Profile | null;
  }
};
