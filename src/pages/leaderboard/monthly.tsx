import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { gameService } from "@/services/gameService";
import { Game } from "@/types";

interface MonthlyLeaderboardEntry {
  id: string;
  playerName: string;
  totalFourPoints: number;
  gamesPlayed: number;
  averageScore: number;
  rank: number;
}

export default function MonthlyLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<MonthlyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();

  const loadMonthlyLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const monthlyGames = await gameService.getMonthlyLeaderboard();

      const playerStats: { [key: string]: MonthlyLeaderboardEntry } = {};

      monthlyGames.forEach((game: Game) => {
        const userId = game.user_id;
        const playerName = game.profiles?.display_name || game.player_name;

        if (!playerStats[userId]) {
          playerStats[userId] = {
            id: userId,
            playerName: playerName,
            totalFourPoints: 0,
            gamesPlayed: 0,
            averageScore: 0,
            rank: 0,
          };
        }

        playerStats[userId].totalFourPoints += game.four_points_earned;
        playerStats[userId].gamesPlayed += 1;
      });

      const sortedPlayers = Object.values(playerStats)
        .map((player) => ({
          ...player,
          averageScore:
            player.gamesPlayed > 0
              ? player.totalFourPoints / player.gamesPlayed
              : 0,
        }))
        .sort((a, b) => b.totalFourPoints - a.totalFourPoints)
        .map((player, index) => ({
          ...player,
          rank: index + 1,
        }));

      setLeaderboard(sortedPlayers);
    } catch (error) {
      console.error("Error loading monthly leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkMonthlyAccess = useCallback(() => {
    if (user) {
      const monthlyAccess = localStorage.getItem(`monthlyAccess_${user.id}`);
      if (monthlyAccess) {
        const accessData = JSON.parse(monthlyAccess);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        if (
          accessData.month === currentMonth &&
          accessData.year === currentYear
        ) {
          setHasAccess(true);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkMonthlyAccess();
      if (hasAccess) {
        loadMonthlyLeaderboard();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user, hasAccess, checkMonthlyAccess, loadMonthlyLeaderboard]);

  const handlePurchaseAccess = async () => {
    if (user) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      localStorage.setItem(`monthlyAccess_${user.id}`, JSON.stringify({
        month: currentMonth,
        year: currentYear,
        paid: true
      }));
      
      const currentPoints = parseInt(localStorage.getItem(`userPoints_${user.id}`) || '0');
      localStorage.setItem(`userPoints_${user.id}`, (currentPoints + 4).toString());
      
      setHasAccess(true);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Monthly Leaderboard</CardTitle>
              <p className="text-muted-foreground">Sign in to access the monthly leaderboard</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/register" className="w-full">
                <Button variant="outline" className="w-full">Create Account</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Monthly Leaderboard</h1>
              <p className="text-muted-foreground">Premium access required</p>
            </div>

            <div className="flex gap-2 mb-6">
              <Link href="/leaderboard/daily" className="flex-1">
                <Button variant="outline" className="w-full">Daily</Button>
              </Link>
              <Button className="flex-1" disabled>Monthly</Button>
            </div>

            <Card>
              <CardContent className="p-6 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Access Required</h3>
                <p className="text-muted-foreground mb-4">
                  Access the monthly leaderboard for $1 and earn 4 bonus points!
                </p>
                <Button onClick={handlePurchaseAccess} className="w-full">
                  Purchase Access - $1
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Includes 4 bonus points added to your account
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Monthly Leaderboard</h1>
            <p className="text-muted-foreground">This month's champions</p>
          </div>

          <div className="flex gap-2 mb-6">
            <Link href="/leaderboard/daily" className="flex-1">
              <Button variant="outline" className="w-full">Daily</Button>
            </Link>
            <Button className="flex-1">Monthly</Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading leaderboard...</p>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No games this month</h3>
                <p className="text-muted-foreground mb-4">Be the first to play and claim the top spot!</p>
                <Link href="/game">
                  <Button>Start Playing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <Card key={entry.id} className={entry.rank <= 3 ? "border-2 border-yellow-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{entry.playerName}</span>
                            <Badge className={getRankBadgeColor(entry.rank)}>
                              #{entry.rank}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.gamesPlayed} games • Avg: {entry.averageScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${entry.totalFourPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.totalFourPoints >= 0 ? '+' : ''}{entry.totalFourPoints}
                          </span>
                          <span className="text-sm text-muted-foreground">4pts</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
