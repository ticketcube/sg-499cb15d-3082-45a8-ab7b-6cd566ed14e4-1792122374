
import { supabase } from "@/integrations/supabase/client";
import { Game, GameScore } from "@/types";
import type { Json, Database } from "@/integrations/supabase/types";

type GameWithProfile = Database["public"]["Tables"]["games"]["Row"] & {
  profiles: { display_name: string | null } | null;
};

type GameInsert = Database["public"]["Tables"]["games"]["Insert"];

interface TargetScoreParams {
  ghinIndex?: number;
  averageScore?: number;
  slopeRating: number;
  courseRating: number;
  par: number;
}

export const gameService = {
  calculateTargetScore({
    ghinIndex,
    averageScore,
    slopeRating,
    courseRating,
    par,
  }: TargetScoreParams): number {
    if (ghinIndex !== undefined) {
      return 36 - (ghinIndex * (slopeRating / 113) + (courseRating - par));
    }
    if (averageScore !== undefined) {
      return 36 - (averageScore - 72);
    }
    throw new Error("Either GHIN index or average score must be provided.");
  },

  async submitGameScore(gameScore: GameScore) {
    console.log("📝 Submitting game score to Supabase:", {
      user_id: gameScore.userId,
      player_name: gameScore.playerName,
      course_name: gameScore.courseName,
      total_points: gameScore.totalPoints,
      four_points_earned: gameScore.fourPointsEarned,
      leaderboard_type: gameScore.leaderboardType,
    });

    // Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const insertData: GameInsert = {
      user_id: gameScore.userId,
      player_name: gameScore.playerName,
      course_name: gameScore.courseName,
      tee_name: gameScore.teeName,
      target_score: gameScore.targetScore,
      total_points: gameScore.totalPoints,
      four_points_earned: gameScore.fourPointsEarned,
      hole_scores: gameScore.holeScores as unknown as Json,
      leaderboard_type: gameScore.leaderboardType,
      paid_entry: gameScore.paidEntry || false,
      game_type: gameScore.gameType,
      course_id: gameScore.courseId && isValidUUID(gameScore.courseId) ? gameScore.courseId : "00000000-0000-0000-0000-000000000000",
      tee_id: gameScore.teeId && isValidUUID(gameScore.teeId) ? gameScore.teeId : "00000000-0000-0000-0000-000000000000",
    };

    const { data, error } = await supabase
      .from("games")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ Error submitting game score:", error);
      throw error;
    }
    console.log("✅ Game score submitted successfully:", data);
    return data;
  },

  async getDailyLeaderboard(): Promise<Game[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("games")
      .select("*, profiles(display_name)")
      .eq("leaderboard_type", "daily")
      .gte("created_at", today.toISOString())
      .order("four_points_earned", { ascending: false });

    if (error) {
      console.error("Error fetching daily leaderboard:", error);
      throw error;
    }
    return (data as GameWithProfile[]) || [];
  },

  async getMonthlyLeaderboard(): Promise<Game[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("games")
      .select("*, profiles(display_name)")
      .eq("leaderboard_type", "monthly")
      .gte("created_at", startOfMonth.toISOString())
      .order("four_points_earned", { ascending: false });

    if (error) {
      console.error("Error fetching monthly leaderboard:", error);
      throw error;
    }
    return (data as GameWithProfile[]) || [];
  },
};
