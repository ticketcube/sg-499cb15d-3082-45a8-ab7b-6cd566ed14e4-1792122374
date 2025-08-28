import type { Database } from "@/integrations/supabase/types";

export interface Course {
  id: string;
  name: string;
  par: number;
  holes: number;
  tees: Tee[];
}

export interface Tee {
  id: string;
  name: string;
  color: string;
  slopeRating: number;
  courseRating: number;
}

export interface GameSettings {
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  par: number;
  slopeRating: number;
  courseRating: number;
  ghinIndex?: number;
  averageScore?: number;
  targetScore: number;
  holes: number;
}

export interface HoleScore {
  hole: number;
  score: number;
  points: number;
}

export interface HoleCategories {
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  bogey_plus: number;
}

export interface GameScore {
  userId: string;
  playerName: string;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  ghinHandicap?: number;
  adjustedAverageScore?: number;
  targetScore: number;
  totalPoints: number;
  fourPointsEarned: number;
  holeScores: HoleScore[];
  holeCategories: HoleCategories;
  timestamp: number;
  validated: boolean;
  leaderboardType?: "monthly" | "daily";
  paidEntry?: boolean;
  gameType: 9 | 18;
}

export interface Profile {
  id: string;
  display_name: string;
  member_cat?: string;
  created_at: string;
  updated_at?: string;
}

export interface StripePrice {
  id: string;
  price_id: string;
  product_name: string;
  member_cat: string;
  active: boolean;
  created_at: string;
}

export interface Game {
  id: string;
  course_name: string;
  tee_name: string;
  created_at: string;
  ghin_handicap: number | null;
  adjusted_average_score: number | null;
  target_score: number;
  total_points: number;
  four_points_earned: number;
  game_type: number;
  user_id: string;
  profiles?: { display_name: string | null } | null;
}

export interface SurveyResponse {
  id: string;
  session_id: string;
  user_id?: string;
  question_1_answer?: string;
  question_2_answer?: string;
  question_3_answer?: string;
  drop_off_step?: number;
  completed: boolean;
  created_at: string;
}

export const scoreOptions = [
  { taps: 1, type: "B", points: 1, color: "text-green-600", bg: "bg-green-100" },
  { taps: 2, type: "P", points: 2, color: "text-blue-600", bg: "bg-blue-100" },
  { taps: 3, type: "Bir", points: 4, color: "text-red-600", bg: "bg-red-100" },
  { taps: 4, type: "E", points: 6, color: "text-purple-600", bg: "bg-purple-100" },
  { taps: 5, type: "R", points: 0, color: "text-gray-600", bg: "bg-gray-100" }
];