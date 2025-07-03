
interface TargetScoreParams {
  ghinIndex?: number;
  averageScore?: number;
  slopeRating: number;
  courseRating: number;
  par: number;
}

export const gameService = {
  calculateTargetScore: ({
    ghinIndex,
    averageScore,
    slopeRating,
    courseRating,
    par
  }: TargetScoreParams): number => {
    if (ghinIndex !== undefined) {
      // GHIN formula: 36 - (Index × (Slope ÷ 113)) + (Course Rating - Par)
      return 36 - (ghinIndex * (slopeRating / 113)) + (courseRating - par);
    } else if (averageScore !== undefined) {
      // Average score formula: 36 - (Average Score - 72)
      return 36 - (averageScore - 72);
    }
    throw new Error("Either GHIN index or average score must be provided");
  }
};
