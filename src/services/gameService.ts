
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
      // Simple average score formula: averageScore - 72
      return averageScore - 72;
    }
    throw new Error("Either GHIN index or average score must be provided");
  }
};
