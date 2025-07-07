
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          display_name: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          display_name?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          display_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
            id: string;
            created_at: string;
            user_id: string;
            player_name: string;
            course_id: string;
            course_name: string;
            tee_id: string;
            tee_name: string;
            target_score: number;
            total_points: number;
            four_points_earned: number;
            hole_scores: Json;
            leaderboard_type: "monthly" | "daily" | null;
            paid_entry: boolean | null;
            game_type: 9 | 18;
        };
        Insert: {
            id?: string;
            created_at?: string;
            user_id: string;
            player_name: string;
            course_id: string;
            course_name: string;
            tee_id: string;
            tee_name: string;
            target_score: number;
            total_points: number;
            four_points_earned: number;
            hole_scores: Json;
            leaderboard_type?: "monthly" | "daily" | null;
            paid_entry?: boolean | null;
            game_type: 9 | 18;
        };
        Update: {
            id?: string;
            created_at?: string;
            user_id?: string;
            player_name?: string;
            course_id?: string;
            course_name?: string;
            tee_id?: string;
            tee_name?: string;
            target_score?: number;
            total_points?: number;
            four_points_earned?: number;
            hole_scores?: Json;
            leaderboard_type?: "monthly" | "daily" | null;
            paid_entry?: boolean | null;
            game_type?: 9 | 18;
        };
        Relationships: [
          {
            foreignKeyName: "games_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string;
          name: string;
          par: number;
          holes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          par: number;
          holes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          par?: number;
          holes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      course_tees: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      daily_prizes: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_points: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
