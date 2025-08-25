
import type { Database } from "@/integrations/supabase/types";

type WaitlistRow = Database["public"]["Tables"]["waitlist"]["Row"];
type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"];
type WaitlistUpdate = Database["public"]["Tables"]["waitlist"]["Update"];

export interface WaitlistEntry extends WaitlistRow {
  profiles?: {
    display_name: string | null;
  } | null;
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
      const response = await fetch(`/api/waitlist?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch waitlist data');
      }

      return result.data;
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

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, dates }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update waitlist');
      }

      return result.data;
    } catch (error) {
      console.error("Error upserting waitlist:", error);
      throw error;
    }
  }

  // Remove user from waitlist
  static async removeFromWaitlist(userId: string): Promise<void> {
    try {
      const response = await fetch(`/api/waitlist?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove from waitlist');
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      throw error;
    }
  }

  // Get all waitlist entries (admin function)
  static async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    try {
      const response = await fetch('/api/waitlist/admin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch waitlist entries');
      }

      return result.data || [];
    } catch (error) {
      console.error("Error fetching all waitlist entries:", error);
      throw error;
    }
  }

  // Format date for display
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Check if a date is available for selection (not in the past)
  static isDateAvailable(date: Date): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date >= now;
  }
}

export default WaitlistService;
