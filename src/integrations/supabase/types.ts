export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          user_id: string | null
          player_name: string
          course_id: string | null
          course_name: string
          tee_id: string | null
          tee_name: string
          target_score: number
          total_points: number
          four_points_earned: number
          hole_scores: Json
          leaderboard_type: string
          paid_entry: boolean
          game_type: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          player_name: string
          course_id?: string | null
          course_name: string
          tee_id?: string | null
          tee_name: string
          target_score: number
          total_points: number
          four_points_earned: number
          hole_scores: Json
          leaderboard_type: string
          paid_entry?: boolean
          game_type: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          player_name?: string
          course_id?: string | null
          course_name?: string
          tee_id?: string | null
          tee_name?: string
          target_score?: number
          total_points?: number
          four_points_earned?: number
          hole_scores?: Json
          leaderboard_type?: string
          paid_entry?: boolean
          game_type?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      course_tees: {
        Row: {
          id: string
          course_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tees_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
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