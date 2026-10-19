import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
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

export async function updateUserProfile(userId: string, updates: Partial<Database['public']['Tables']['user_profiles']['Update']>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}

export const userService = {
  async updateProfile(userId: string, displayName: string): Promise<Profile | null> {
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .update({ 
        display_name: displayName,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (profileError) {
      console.error("Error updating profile:", profileError);
      if (profileError.code === 'PGRST116') {
        console.warn(`Profile not found for user ${userId}, cannot update.`);
        return null;
      } else {
        throw profileError;
      }
    }

    // Also update the user metadata in Supabase Auth.
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      throw metadataError;
    }

    return profileData;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

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