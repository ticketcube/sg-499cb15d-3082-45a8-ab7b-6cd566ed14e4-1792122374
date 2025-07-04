import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Users, Gift, Calendar } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { gameService } from "@/services/gameService";
import { GameScore } from "@/types";

export default function GameCompletePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameSettings, totalPoints, fourPointsEarned, holeScores, resetGame } = useGame();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure context is loaded before checking
    const timer = setTimeout(() => {
      if (!gameSettings) {
        console.log('❌ No game settings found in complete page, redirecting to /game');
        router.push("/game");
      } else {
        console.log('✅ Game settings found in complete page:', gameSettings);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gameSettings, router]);

  const handleSubmitToMonthly = async () => {
    if (!user || !gameSettings) return;

    setSubmitting(true);
    try {
      const gameScoreData: GameScore = {
        userId: user.id,
        playerName: user.user_metadata?.display_name || "Anonymous Player",
        courseId: gameSettings.courseId,
        courseName: gameSettings.courseName,
        teeId: gameSettings.teeId,
        teeName: gameSettings.teeName,
        targetScore: gameSettings.targetScore,
        totalPoints: totalPoints,
        fourPointsEarned: fourPointsEarned,
        holeScores: holeScores,
        timestamp: Date.now(),
        validated: true,
        leaderboardType: "monthly",
        gameType: gameSettings.holes,
      };

      await gameService.submitGameScore(gameScoreData);

      toast({
        title: "Score submitted!",
        description: "Your score has been added to the monthly leaderboard.",
      });

      router.push("/leaderboard/monthly");
    } catch (error) {
      console.error("Error submitting to monthly leaderboard:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit score. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitToDaily = async () => {
    if (!user || !gameSettings) return;

    setSubmitting(true);
    try {
      const paymentSuccess = await simulatePayment();

      if (paymentSuccess) {
        const gameScoreData: GameScore = {
          userId: user.id,
          playerName: user.user_metadata?.display_name || "Anonymous Player",
          courseId: gameSettings.courseId,
          courseName: gameSettings.courseName,
          teeId: gameSettings.teeId,
          teeName: gameSettings.teeName,
          targetScore: gameSettings.targetScore,
          totalPoints: totalPoints,
          fourPointsEarned: fourPointsEarned,
          holeScores: holeScores,
          timestamp: Date.now(),
          validated: true,
          leaderboardType: "daily",
          paidEntry: true,
          gameType: gameSettings.holes,
        };

        await gameService.submitGameScore(gameScoreData);

        toast({
          title: "Payment successful!",
          description: "Your score has been added to the daily prizes leaderboard.",
        });

        router.push("/leaderboard/daily");
      }
    } catch (error) {
      console.error("Error submitting to daily prizes:", error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "Payment could not be processed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const simulatePayment = async (): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  };

  const handleNewGame = () => {
    resetGame();
    router.push("/game");
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
          Sign in or create an account to submit your score.
        </p>
        <div className="flex flex-col gap-2">
          <Link href={`/auth/login?redirect=${router.asPath}`} className="flex-1">
            <Button variant="outline" className="w-full">Sign In</Button>
          </Link>
          <Link href={`/auth/register?redirect=${router.asPath}`} className="flex-1">
            <Button className="w-full">Register</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const renderLeaderboardOptions = () => (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-center">Submit Your Score</h3>
      <Card className="border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Monthly Leaderboard</span>
            </div>
            <Badge className="bg-green-100 text-green-800">FREE</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Compete with players all month long. Track your progress and climb the rankings!
          </p>
          <Button
            onClick={handleSubmitToMonthly}
            disabled={submitting}
            className="w-full"
            variant="outline"
          >
            {submitting ? "Submitting..." : "Submit to Monthly"}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-2 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">Daily Prizes</span>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">$1</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Enter today's prize competition! Winners receive cash prizes and bonus points.
          </p>
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>1st: $50 • 2nd: $25 • 3rd: $10</span>
          </div>
          <Button onClick={handleSubmitToDaily} disabled={submitting} className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            {submitting ? "Processing..." : "Enter Daily Prizes - $1"}
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
              <div className="grid grid-cols-3 gap-4 text-center">
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
            </CardContent>
          </Card>

          {user ? renderLeaderboardOptions() : renderAuthPrompt()}

          <div className="space-y-2 mt-6">
            <Button onClick={handleNewGame} variant="outline" size="lg" className="w-full">
              Play Another Round
            </Button>
            <Link href="/leaderboard/daily" className="block">
              <Button variant="ghost" size="lg" className="w-full">
                View Leaderboards
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
