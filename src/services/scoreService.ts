import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type GameInsert = Database['public']['Tables']['games']['Insert'];

export interface GameScoreData {
  player_name: string;
  course_name: string;
  course_id: string;
  tee_name: string;
  tee_id: string;
  target_score: number;
  four_points_earned: number;
  total_points: number;
  hole_scores: number[];
  game_type: 9 | 18;
  ghin_handicap?: number;
  adjusted_average_score?: number;
  user_id?: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string | null;
  player_name: string;
  course_name: string;
  total_points: number;
  four_points_earned: number;
  created_at: string | null;
  rank: number;
}

export const scoreService = {
  async submitScore(scoreData: GameScoreData) {
    try {
      const gameInsert: GameInsert = {
        player_name: scoreData.player_name,
        course_name: scoreData.course_name,
        course_id: scoreData.course_id,
        tee_name: scoreData.tee_name,
        tee_id: scoreData.tee_id,
        target_score: scoreData.target_score,
        four_points_earned: scoreData.four_points_earned,
        total_points: scoreData.total_points,
        hole_scores: scoreData.hole_scores,
        game_type: scoreData.game_type,
        ghin_handicap: scoreData.ghin_handicap,
        adjusted_average_score: scoreData.adjusted_average_score,
        user_id: scoreData.user_id,
      };

      const { data, error } = await supabase
        .from('games')
        .insert([gameInsert])
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
        .from('games')
        .select(`
          id,
          user_id,
          player_name,
          course_name,
          total_points,
          four_points_earned,
          created_at,
          profiles(display_name)
        `)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Error fetching monthly leaderboard:', error);
        throw error;
      }

      // Group by user and get their best score
      const userBestScores: { [key: string]: LeaderboardEntry } = {};

      data?.forEach((entry) => {
        const userId = entry.user_id || `guest_${entry.player_name}`;
        const playerName = entry.profiles?.display_name || entry.player_name;
        
        if (!userBestScores[userId] || entry.total_points > userBestScores[userId].total_points) {
          userBestScores[userId] = {
            id: entry.id,
            user_id: entry.user_id,
            player_name: playerName,
            course_name: entry.course_name,
            total_points: entry.total_points,
            four_points_earned: entry.four_points_earned,
            created_at: entry.created_at,
            rank: 0, // Will be set below
          };
        }
      });

      // Convert to array and sort by total_points
      const sortedEntries = Object.values(userBestScores)
        .sort((a, b) => b.total_points - a.total_points)
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
        .from('games')
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
