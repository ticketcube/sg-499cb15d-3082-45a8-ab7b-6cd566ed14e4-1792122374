
import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { scoreService, LeaderboardEntry } from "@/services/scoreService";

export default function MonthlyLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadMonthlyLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await scoreService.getMonthlyLeaderboard();
      setLeaderboard(entries);
    } catch (error) {
      console.error("Error loading monthly leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonthlyLeaderboard();
  }, [loadMonthlyLeaderboard]);

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

  if (!user && !loading && leaderboard.length === 0) {
    return (
      <Layout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Monthly Leaderboard</CardTitle>
              <p className="text-muted-foreground">Sign in to see your rank</p>
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
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">MONTHLY LEADERBOARD</h1>
            <p className="text-muted-foreground">This month's top performers based on best score.</p>
            <Badge variant="outline" className="mt-2 border-green-400 bg-green-50 text-green-800">Free to Play</Badge>
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
                <h3 className="text-lg font-semibold mb-2">No scores this month</h3>
                <p className="text-muted-foreground mb-4">Be the first to play and claim the top spot!</p>
                <Link href="/game">
                  <Button>Start Playing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <Card key={entry.id} className={`${entry.rank <= 3 ? "border-2 border-yellow-200" : ""} ${entry.user_id === user?.id ? "bg-blue-50 border-blue-200" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{entry.player_name}</span>
                            <Badge className={getRankBadgeColor(entry.rank)}>
                              #{entry.rank}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.course_name || "Unknown Course"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">
                            {entry.total_points}
                          </span>
                          <span className="text-sm text-muted-foreground">pts</span>
                        </div>
                        {entry.four_points_earned !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            4pts: {entry.four_points_earned >= 0 ? '+' : ''}{entry.four_points_earned}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="pt-4">
                <Link href="/game" className="w-full">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Start New Game
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Monthly Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Bonus points are awarded at the end of the month to top players.</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    1st Place
                  </span>
                  <span className="font-semibold text-green-600">+100 bonus</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    2nd Place
                  </span>
                  <span className="font-semibold text-green-600">+50 bonus</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-amber-600" />
                    3rd Place
                  </span>
                  <span className="font-semibold text-green-600">+25 bonus</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
