
import { supabase } from "@/integrations/supabase/client";

export interface GameScoreData {
  user_id: string;
  score: number;
  game_data: {
    player_name: string;
    course_name: string;
    course_id: string;
    tee_name: string;
    tee_id: string;
    target_score: number;
    four_points_earned: number;
    hole_scores: number[];
    game_type: 9 | 18;
    ghin_handicap?: number;
    adjusted_average_score?: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  game_data: any;
  created_at: string;
  player_name: string;
  rank: number;
}

export const scoreService = {
  async submitScore(scoreData: GameScoreData) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .insert([scoreData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting score:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Score submission failed:', error);
      throw error;
    }
  },

  async getMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          id,
          user_id,
          score,
          game_data,
          created_at,
          profiles!inner(display_name)
        `)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching monthly leaderboard:', error);
        throw error;
      }

      // Group by user and get their best score
      const userBestScores: { [key: string]: LeaderboardEntry } = {};

      data?.forEach((entry: any) => {
        const userId = entry.user_id;
        const playerName = entry.profiles?.display_name || entry.game_data?.player_name || "Anonymous";
        
        if (!userBestScores[userId] || entry.score > userBestScores[userId].score) {
          userBestScores[userId] = {
            id: entry.id,
            user_id: userId,
            score: entry.score,
            game_data: entry.game_data,
            created_at: entry.created_at,
            player_name: playerName,
            rank: 0, // Will be set below
          };
        }
      });

      // Convert to array and sort by score
      const sortedEntries = Object.values(userBestScores)
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return sortedEntries;
    } catch (error) {
      console.error('Failed to fetch monthly leaderboard:', error);
      throw error;
    }
  },

  async getUserScores(userId: string) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user scores:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user scores:', error);
      throw error;
    }
  }
};

export default scoreService;
