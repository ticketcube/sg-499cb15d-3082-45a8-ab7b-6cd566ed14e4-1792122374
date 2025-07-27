
import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Edit } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { scoreService, GameScoreData } from "@/services/scoreService";

const PENDING_GAME_SUBMISSION_KEY = "pendingGameSubmission";

export default function GameCompletePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameSettings, totalPoints, fourPointsEarned, holeScores, resetGame } = useGame();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameSettings) {
        console.log("❌ No game settings found in complete page, redirecting to /game");
        router.push("/game");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gameSettings, router]);

  const handlePostScore = useCallback(async () => {
    if (!user || !gameSettings) return;

    setSubmitting(true);
    try {
      const scoreData: GameScoreData = {
        user_id: user.id,
        player_name: user.user_metadata?.display_name || "Anonymous Player",
        course_name: gameSettings.courseName,
        course_id: gameSettings.courseId,
        tee_name: gameSettings.teeName,
        tee_id: gameSettings.teeId,
        target_score: gameSettings.targetScore,
        four_points_earned: fourPointsEarned,
        total_points: totalPoints,
        hole_scores: holeScores.map(s => s.score),
        game_type: gameSettings.holes as 9 | 18,
        ghin_handicap: gameSettings.ghinIndex,
        adjusted_average_score: gameSettings.averageScore,
      };

      await scoreService.submitScore(scoreData);

      toast({
        title: "Score Posted!",
        description: "Your score has been added to the leaderboard.",
      });

      await router.push("/leaderboard/monthly");
      
      resetGame();
    } catch (error) {
      console.error("❌ Error posting score:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post score. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [user, gameSettings, totalPoints, fourPointsEarned, holeScores, toast, router, resetGame]);

  useEffect(() => {
    if (user && localStorage.getItem(PENDING_GAME_SUBMISSION_KEY)) {
      const pendingGame = JSON.parse(localStorage.getItem(PENDING_GAME_SUBMISSION_KEY) || "{}");
      if (pendingGame && gameSettings) {
        handlePostScore();
        localStorage.removeItem(PENDING_GAME_SUBMISSION_KEY);
      }
    }
  }, [user, gameSettings, handlePostScore]);

  const handleNewGame = () => {
    resetGame();
    router.push("/game");
  };

  const handleEditScore = () => {
    router.back();
  };

  if (!gameSettings) {
    return null;
  }

  const renderAuthPrompt = () => (
    <Card className="mb-6">
      <CardHeader className="text-center">
        <CardTitle>Almost there!</CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-center">
        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          Sign in or create an account to post your score.
        </p>
        <div className="flex flex-col gap-2">
          <Link 
            href={`/auth/login?redirect=${router.asPath}`} 
            className="flex-1"
            onClick={() => {
              if (gameSettings) {
                localStorage.setItem(PENDING_GAME_SUBMISSION_KEY, JSON.stringify({
                  gameSettings,
                  totalPoints,
                  fourPointsEarned,
                  holeScores,
                }));
              }
            }}
          >
            <Button variant="outline" className="w-full">Sign In</Button>
          </Link>
          <Link 
            href={`/auth/register?redirect=${router.asPath}`} 
            className="flex-1"
            onClick={() => {
              if (gameSettings) {
                localStorage.setItem(PENDING_GAME_SUBMISSION_KEY, JSON.stringify({
                  gameSettings,
                  totalPoints,
                  fourPointsEarned,
                  holeScores,
                }));
              }
            }}
          >
            <Button className="w-full">Register</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const renderPostScoreSection = () => (
    <div className="space-y-4 mb-6">
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Submit to the Monthly Leaderboard
          </p>
          <Button
            onClick={handlePostScore}
            disabled={submitting}
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg"
          >
            {submitting ? "POSTING..." : "POST SCORE"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Game Complete!</CardTitle>
              <p className="text-muted-foreground">{gameSettings.courseName}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target</p>
                  <p className="text-2xl font-bold">{gameSettings.targetScore}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">4Points</p>
                  <p className={`text-2xl font-bold ${fourPointsEarned >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fourPointsEarned >= 0 ? "+" : ""}{fourPointsEarned}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleEditScore} 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Score
              </Button>
            </CardContent>
          </Card>

          {user ? renderPostScoreSection() : renderAuthPrompt()}

          <div className="space-y-2 mt-6">
            <Button onClick={handleNewGame} variant="outline" size="lg" className="w-full">
              Play Another Round
            </Button>
            <Link href="/leaderboard/monthly" className="block">
              <Button variant="ghost" size="lg" className="w-full">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
