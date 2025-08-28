
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trophy, TrendingUp, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";

interface PlayerRound {
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
}

export default function RoundDataPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { roundId } = router.query;
  const [pastRounds, setPastRounds] = useState<PlayerRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<PlayerRound | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      loadRoundData();
    }
  }, [user, loading, router]);

  const loadRoundData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data: games, error } = await supabase
        .from("games")
        .select(`
          id,
          course_name,
          tee_name,
          created_at,
          ghin_handicap,
          adjusted_average_score,
          target_score,
          total_points,
          four_points_earned,
          game_type
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rounds:", error);
        return;
      }

      setPastRounds(games as PlayerRound[]);

      // If roundId is specified, select that round
      if (roundId && typeof roundId === "string") {
        const round = games.find(g => g.id === roundId);
        if (round) {
          setSelectedRound(round as PlayerRound);
        }
      }

    } catch (error) {
      console.error("Error loading round data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      weekday: "long"
    });
  };

  const getScoreDisplay = (round: PlayerRound) => {
    if (round.ghin_handicap !== null) {
      return `GHIN Handicap: ${round.ghin_handicap}`;
    } else if (round.adjusted_average_score !== null) {
      return `Adjusted Average: ${round.adjusted_average_score}`;
    }
    return "Score not available";
  };

  const getGameTypeDisplay = (gameType: number) => {
    switch (gameType) {
      case 1: return "Traditional Scoring";
      case 2: return "Alternative Scoring";
      default: return "Unknown Game Type";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/profile')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        <h1 className="text-2xl font-bold">Round Details</h1>
      </div>

      {/* Selected Round Detail */}
      {selectedRound && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selected Round Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Course</label>
                  <p className="text-lg font-semibold">{selectedRound.course_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Tees</label>
                  <p className="text-gray-900">{selectedRound.tee_name} Tees</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Date Played</label>
                  <p className="text-gray-900">{formatDate(selectedRound.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Game Type</label>
                  <p className="text-gray-900">{getGameTypeDisplay(selectedRound.game_type)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Your Score</label>
                  <p className="text-lg font-semibold">{getScoreDisplay(selectedRound)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Target Score</label>
                  <p className="text-gray-900">{selectedRound.target_score}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Total Points Earned</label>
                  <p className="text-2xl font-bold text-green-600">{selectedRound.total_points}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">4-Points Performance</label>
                  <p className={`text-xl font-bold ${selectedRound.four_points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedRound.four_points_earned >= 0 ? '+' : ''}{selectedRound.four_points_earned}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Rounds */}
      <Card>
        <CardHeader>
          <CardTitle>All Your Rounds ({pastRounds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pastRounds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No rounds played yet.</p>
              <Button className="mt-4" onClick={() => router.push("/")}>
                Play Your First Round
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pastRounds.map((round) => (
                <Card 
                  key={round.id} 
                  className={`cursor-pointer transition-colors ${selectedRound?.id === round.id ? 'ring-2 ring-green-500' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedRound(round)}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold">{round.course_name}</h3>
                        <p className="text-sm text-muted-foreground">{round.tee_name} Tees</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(round.created_at).split(',')[0]}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{getScoreDisplay(round)}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Target: {round.target_score}</span>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">{round.total_points} pts</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className={`h-4 w-4 ${round.four_points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`text-sm font-medium ${round.four_points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {round.four_points_earned >= 0 ? '+' : ''}{round.four_points_earned}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
