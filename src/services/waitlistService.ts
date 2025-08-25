import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WaitlistRow = Database["public"]["Tables"]["waitlist"]["Row"];
type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"];
type WaitlistUpdate = Database["public"]["Tables"]["waitlist"]["Update"];

export interface WaitlistEntry {
  id: string;
  avail_1: string;
  avail_2: string | null;
  avail_3: string | null;
  created_at: string;
}

export class WaitlistService {
  // Generate all Sundays from now until end of year
  static getAvailableSundays(): Date[] {
    const sundays: Date[] = [];
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31); // December 31st
    
    // Find next Sunday
    let current = new Date(now);
    current.setDate(current.getDate() + (7 - current.getDay()) % 7);
    
    // If today is Sunday, start from today
    if (now.getDay() === 0) {
      current = new Date(now);
    }
    
    // Collect all Sundays until end of year
    while (current <= endOfYear) {
      sundays.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return sundays;
  }

  // Get user's current waitlist entry
  static async getUserWaitlist(userId: string): Promise<WaitlistEntry | null> {
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - user not on waitlist yet
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching user waitlist:", error);
      throw error;
    }
  }

  // Create or update user's waitlist entry
  static async upsertWaitlist(
    userId: string, 
    dates: string[]
  ): Promise<WaitlistEntry> {
    try {
      if (dates.length === 0) {
        throw new Error("At least one date is required");
      }
      
      if (dates.length > 3) {
        throw new Error("Maximum 3 dates allowed");
      }

      const waitlistData: WaitlistInsert = {
        id: userId,
        avail_1: dates[0],
        avail_2: dates[1] || null,
        avail_3: dates[2] || null,
      };

      const { data, error } = await supabase
        .from("waitlist")
        .upsert(waitlistData)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error upserting waitlist:", error);
      throw error;
    }
  }

  // Remove user from waitlist
  static async removeFromWaitlist(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("waitlist")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      throw error;
    }
  }

  // Get all waitlist entries (admin function)
  static async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select(`
          *,
          profiles!waitlist_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching all waitlist entries:", error);
      throw error;
    }
  }

  // Format date for display
  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }

  // Convert Date to YYYY-MM-DD string for database
  static formatDateForDatabase(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export default WaitlistService;