
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame } from "@/contexts/GameContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function GameSummaryPage() {
  const { gameSettings, totalPoints, fourPointsEarned, resetGame } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!gameSettings) {
      router.push('/game');
    }
  }, [gameSettings, router]);

  if (!gameSettings) {
    return null;
  }

  const handlePlayAgain = () => {
    resetGame();
    router.push('/game');
  }

  return (
    <Layout>
      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Game Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">Congratulations on completing your round at</p>
            <p className="text-xl font-bold">{gameSettings.courseName}</p>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="text-2xl font-bold">{gameSettings.targetScore}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">4Points</p>
                  <p className={`text-2xl font-bold ${fourPointsEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fourPointsEarned >= 0 ? '+' : ''}{fourPointsEarned}
                  </p>
                </div>
            </div>

            <div className="pt-6 space-y-2">
                <Button onClick={handlePlayAgain} size="lg" className="w-full">Play Again</Button>
                <Link href="/" passHref>
                    <Button variant="outline" size="lg" className="w-full">Back to Home</Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
