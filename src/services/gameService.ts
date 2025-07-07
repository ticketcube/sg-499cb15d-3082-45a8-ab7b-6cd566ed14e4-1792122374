
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

async function getLeaderboard(type: 'daily' | 'monthly'): Promise<Game[]> {
    const dateFilter = new Date();
    if (type === 'daily') {
        dateFilter.setHours(0, 0, 0, 0);
    } else { // monthly
        dateFilter.setDate(1);
        dateFilter.setHours(0, 0, 0, 0);
    }

    const {  games, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("leaderboard_type", type)
      .gte("created_at", dateFilter.toISOString())
      .order("four_points_earned", { ascending: false });

    if (gamesError) {
      console.error(`Error fetching ${type} games:`, gamesError);
      throw gamesError;
    }

    if (!games || games.length === 0) {
      return [];
    }

    const userIds = [...new Set(games.map(g => g.user_id).filter((id): id is string => !!id))];
    
    if (userIds.length === 0) {
        return games.map(g => ({ ...g, profiles: null })) as GameWithProfile[];
    }

    const {  profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesError) {
      console.error(`Error fetching profiles for ${type} leaderboard:`, profilesError);
      return games.map(g => ({ ...g, profiles: null })) as GameWithProfile[];
    }

    const profilesMap = new Map(profiles?.map(p => [p.id, p.display_name || '']) || []);

    const gamesWithProfiles = games.map(game => ({
      ...game,
      profiles: { display_name: profilesMap.get(game.user_id) || game.player_name || null }
    }));

    return (gamesWithProfiles as GameWithProfile[]);
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

    const isValidUUID = (str: string): boolean => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const defaultUUID = "00000000-0000-0000-0000-000000000000";
    const courseId = isValidUUID(gameScore.courseId) ? gameScore.courseId : defaultUUID;
    const teeId = isValidUUID(gameScore.teeId) ? gameScore.teeId : defaultUUID;

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
      course_id: courseId,
      tee_id: teeId
    };

    try {
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
    } catch (error) {
      console.error("❌ Error in submitGameScore:", error);
      throw error;
    }
  },

  async getDailyLeaderboard(): Promise<Game[]> {
    return getLeaderboard('daily');
  },

  async getMonthlyLeaderboard(): Promise<Game[]> {
    return getLeaderboard('monthly');
  },
};
