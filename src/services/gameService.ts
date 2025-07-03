import { supabase } from "@/integrations/supabase/client";
import { GameScore } from "@/types";

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
    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id: gameScore.userId,
        player_name: gameScore.playerName,
        course_id: gameScore.courseId,
        course_name: gameScore.courseName,
        tee_id: gameScore.teeId,
        tee_name: gameScore.teeName,
        target_score: gameScore.targetScore,
        total_points: gameScore.totalPoints,
        four_points_earned: gameScore.fourPointsEarned,
        hole_scores: [],
        leaderboard_type: gameScore.leaderboardType,
        paid_entry: gameScore.paidEntry,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting game score:", error);
      throw error;
    }
    return data;
  },

  async getDailyLeaderboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("games")
      .select("*, profiles(display_name)")
      .eq("leaderboard_type", "daily")
      .gte("created_at", today.toISOString())
      .order("four_points_earned", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getMonthlyLeaderboard() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("games")
      .select("*, profiles(display_name)")
      .eq("leaderboard_type", "monthly")
      .gte("created_at", startOfMonth.toISOString())
      .order("four_points_earned", { ascending: false });

    if (error) throw error;
    return data;
  },
};
