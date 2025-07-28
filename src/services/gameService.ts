import { supabase } from "@/integrations/supabase/client";
import { Game, GameScore, HoleCategories } from "@/types";
import type { Json } from "@/integrations/supabase/types";

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

  calculateHoleCategories(holeScores: { hole: number; score: number; points: number }[], par: number = 72): HoleCategories {
    const categories: HoleCategories = {
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      bogey_plus: 0
    };

    const parPerHole = par / holeScores.length; // Assume even distribution

    holeScores.forEach(hole => {
      const scoreToPar = hole.score - parPerHole;
      
      if (scoreToPar <= -2) {
        categories.eagle++;
      } else if (scoreToPar === -1) {
        categories.birdie++;
      } else if (scoreToPar === 0) {
        categories.par++;
      } else if (scoreToPar === 1) {
        categories.bogey++;
      } else {
        categories.bogey_plus++;
      }
    });

    return categories;
  },

  async submitGameScore(gameScore: GameScore) {
    console.log('📝 Submitting game score to Supabase:', {
      user_id: gameScore.userId,
      player_name: gameScore.playerName,
      course_name: gameScore.courseName,
      ghin_handicap: gameScore.ghinHandicap,
      adjusted_average_score: gameScore.adjustedAverageScore,
      target_score: gameScore.targetScore,
      total_points: gameScore.totalPoints,
      four_points_earned: gameScore.fourPointsEarned,
      hole_categories: gameScore.holeCategories,
      leaderboard_type: gameScore.leaderboardType,
    });

    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id: gameScore.userId,
        player_name: gameScore.playerName,
        course_id: gameScore.courseId,
        course_name: gameScore.courseName,
        tee_id: gameScore.teeId,
        tee_name: gameScore.teeName,
        ghin_handicap: gameScore.ghinHandicap,
        adjusted_average_score: gameScore.adjustedAverageScore,
        target_score: gameScore.targetScore,
        total_points: gameScore.totalPoints,
        four_points_earned: gameScore.fourPointsEarned,
        hole_scores: gameScore.holeScores as unknown as Json,
        hole_categories: gameScore.holeCategories as unknown as Json,
        leaderboard_type: gameScore.leaderboardType,
        paid_entry: gameScore.paidEntry,
        game_type: gameScore.gameType,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error submitting game score:", error);
      throw error;
    }
    console.log('✅ Game score submitted successfully:', data);
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
    return (data as unknown as Game[]) || [];
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
      .order("total_points", { ascending: false });

    if (error) {
      console.error("Error fetching monthly leaderboard:", error);
      throw error;
    }
    return (data as unknown as Game[]) || [];
  },

  async getGameById(gameId: string): Promise<Game> {
    const { data, error } = await supabase
      .from("games")
      .select("*, profiles(display_name)")
      .eq("id", gameId)
      .single();

    if (error) {
      console.error("Error fetching game by ID:", error);
      throw error;
    }
    return data as unknown as Game;
  },
};
  
