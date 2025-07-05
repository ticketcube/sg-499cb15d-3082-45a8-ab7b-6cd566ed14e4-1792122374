import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { gameService } from "@/services/gameService";
import { Game } from "@/types";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  fourPointsEarned: number;
  courseName: string;
  rank: number;
}

export default function DailyLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDailyLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDailyLeaderboard = async () => {
    setLoading(true);
    try {
      const dailyGames = await gameService.getDailyLeaderboard();
      
      const todaysGames = dailyGames.map((game: Game, index: number) => ({
        id: game.id,
        playerName: game.profiles?.display_name || game.player_name,
        fourPointsEarned: game.four_points_earned,
        courseName: game.course_name,
        rank: index + 1,
      }));

      setLeaderboard(todaysGames);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
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

  const getBonusPoints = (rank: number) => {
    switch (rank) {
      case 1:
        return 18;
      case 2:
        return 10;
      case 3:
        return 8;
      default:
        return 0;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Daily Leaderboard</CardTitle>
              <p className="text-muted-foreground">Sign in to view the daily leaderboard</p>
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

  return (
    <Layout>
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Daily Leaderboard</h1>
            <p className="text-muted-foreground">Today's top performers</p>
          </div>

          <div className="flex gap-2 mb-6">
            <Button className="flex-1">Daily</Button>
            <Link href="/leaderboard/monthly" className="flex-1">
              <Button variant="outline" className="w-full">Monthly</Button>
            </Link>
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
                <h3 className="text-lg font-semibold mb-2">No games today</h3>
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
                          <p className="text-sm text-muted-foreground">{entry.courseName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${entry.fourPointsEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.fourPointsEarned >= 0 ? '+' : ''}{entry.fourPointsEarned}
                          </span>
                          <span className="text-sm text-muted-foreground">4pts</span>
                        </div>
                        {getBonusPoints(entry.rank) > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            +{getBonusPoints(entry.rank)} bonus
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Daily Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    1st Place
                  </span>
                  <span className="font-semibold text-green-600">+18 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    2nd Place
                  </span>
                  <span className="font-semibold text-green-600">+10 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-amber-600" />
                    3rd Place
                  </span>
                  <span className="font-semibold text-green-600">+8 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
