
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

export interface GameScore {
  userId: string;
  playerName: string;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  targetScore: number;
  totalPoints: number;
  fourPointsEarned: number;
  holeScores: HoleScore[];
  timestamp: number;
  validated: boolean;
}

export const scoreOptions = [
  { taps: 1, type: "B", points: 1, color: "text-green-600", bg: "bg-green-100" },
  { taps: 2, type: "P", points: 2, color: "text-blue-600", bg: "bg-blue-100" },
  { taps: 3, type: "Bir", points: 4, color: "text-red-600", bg: "bg-red-100" },
  { taps: 4, type: "E", points: 6, color: "text-purple-600", bg: "bg-purple-100" },
  { taps: 5, type: "R", points: 0, color: "text-gray-600", bg: "bg-gray-100" }
];
