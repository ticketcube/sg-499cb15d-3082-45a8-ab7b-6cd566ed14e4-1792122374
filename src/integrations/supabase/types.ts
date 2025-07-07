export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      course_tees: {
        Row: {
          color: string
          course_id: string | null
          course_rating: number
          created_at: string | null
          id: string
          name: string
          slope_rating: number
        }
        Insert: {
          color: string
          course_id?: string | null
          course_rating: number
          created_at?: string | null
          id?: string
          name: string
          slope_rating: number
        }
        Update: {
          color?: string
          course_id?: string | null
          course_rating?: number
          created_at?: string | null
          id?: string
          name?: string
          slope_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_tees_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          holes: number
          id: string
          name: string
          par: number
        }
        Insert: {
          created_at?: string | null
          holes: number
          id?: string
          name: string
          par: number
        }
        Update: {
          created_at?: string | null
          holes?: number
          id?: string
          name?: string
          par?: number
        }
        Relationships: []
      }
      daily_prizes: {
        Row: {
          created_at: string | null
          date: string | null
          game_id: string | null
          id: string
          paid: boolean | null
          prize_amount: number | null
          rank: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          game_id?: string | null
          id?: string
          paid?: boolean | null
          prize_amount?: number | null
          rank?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          game_id?: string | null
          id?: string
          paid?: boolean | null
          prize_amount?: number | null
          rank?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_prizes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          course_id: string | null
          course_name: string
          created_at: string | null
          four_points_earned: number
          game_type: number
          hole_scores: Json
          id: string
          leaderboard_type: string | null
          paid_entry: boolean | null
          player_name: string
          target_score: number
          tee_id: string | null
          tee_name: string
          total_points: number
          user_id: string | null
          user_type: string | null
          validated: boolean | null
        }
        Insert: {
          course_id?: string | null
          course_name: string
          created_at?: string | null
          four_points_earned: number
          game_type?: number
          hole_scores: Json
          id?: string
          leaderboard_type?: string | null
          paid_entry?: boolean | null
          player_name: string
          target_score: number
          tee_id?: string | null
          tee_name: string
          total_points: number
          user_id?: string | null
          user_type?: string | null
          validated?: boolean | null
        }
        Update: {
          course_id?: string | null
          course_name?: string
          created_at?: string | null
          four_points_earned?: number
          game_type?: number
          hole_scores?: Json
          id?: string
          leaderboard_type?: string | null
          paid_entry?: boolean | null
          player_name?: string
          target_score?: number
          tee_id?: string | null
          tee_name?: string
          total_points?: number
          user_id?: string | null
          user_type?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_games_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_tee_id_fkey"
            columns: ["tee_id"]
            isOneToOne: false
            referencedRelation: "course_tees"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_users: {
        Row: {
          created_at: string | null
          games_played: number | null
          golfer_name: string
          id: string
          last_used: string | null
        }
        Insert: {
          created_at?: string | null
          games_played?: number | null
          golfer_name: string
          id?: string
          last_used?: string | null
        }
        Update: {
          created_at?: string | null
          games_played?: number | null
          golfer_name?: string
          id?: string
          last_used?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
