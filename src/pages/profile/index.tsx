
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, TrendingUp } from "lucide-react";
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

export default function ProfilePage() {
  const { user, profile: contextProfile, loading } = useAuth();
  const router = useRouter();
  
  // OPTIMIZATION #1: Use contextProfile instead of separate profile state
  // OPTIMIZATION #2: Combined loading states
  const [pastRounds, setPastRounds] = useState<PlayerRound[]>([]);
  const [loadingState, setLoadingState] = useState({ data: true, saving: false });
  const [waitlist, setWaitlist] = useState<{
      avail_1: string;
      avail_2?: string | null;
      avail_3?: string | null;
  } | null>(null);

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingState(prev => ({ ...prev, data: true }));

      // PERFORMANCE FIX: Parallelize database queries
      const [gamesResponse, waitlistResponse] = await Promise.all([
        // Load past rounds - simplified query for better performance
        supabase
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
          .order("created_at", { ascending: false }),
        
        // Load waitlist data
        supabase
          .from("waitlist")
          .select("avail_1, avail_2, avail_3")
          .eq("id", user.id)
          .maybeSingle()
      ]);

      // Process games data
      if (gamesResponse.error) {
        console.error("Error fetching past rounds:", gamesResponse.error);
      } else {
        setPastRounds(gamesResponse.data as PlayerRound[]);
      }

      // Process waitlist data
      if (waitlistResponse.error) {
        console.error("Error fetching waitlist:", waitlistResponse.error);
      } else {
        setWaitlist(waitlistResponse.data);
      }

    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoadingState(prev => ({ ...prev, data: false }));
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      loadProfileData();
    }
  }, [user, loading, router, loadProfileData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getScoreDisplay = (round: PlayerRound) => {
    if (round.ghin_handicap !== null) {
      return `GHIN: ${round.ghin_handicap}`;
    } else if (round.adjusted_average_score !== null) {
      return `AVG: ${round.adjusted_average_score}`;
    }
    return "N/A";
  };

  // FEATURE ENHANCEMENT: Get most recent round for simplified display
  const mostRecentRound = pastRounds.length > 0 ? pastRounds[0] : null;

  if (loading || loadingState.data) {
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
      {/* Profile Header - SIMPLIFIED (No editing functionality) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Display Name</label>
            <p className="text-gray-900">
              {contextProfile?.display_name || user.email?.split("@")[0] || "Not set"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Total Points</label>
            <p className="text-2xl font-bold text-green-600">
              {pastRounds.reduce((total, round) => total + (round.total_points || 0), 0)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Rounds Played</label>
            <p className="text-xl font-semibold text-gray-900">{pastRounds.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Most Recent Round - SIMPLIFIED (3 data points only) */}
      {mostRecentRound && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Most Recent Round</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/rounddata?roundId=${mostRecentRound.id}`)}
              >
                View Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data Point 1: Course & Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{mostRecentRound.course_name}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(mostRecentRound.created_at)}</p>
                </div>
              </div>
              
              {/* Data Point 2: Score/Handicap */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{getScoreDisplay(mostRecentRound)}</Badge>
                <span className="text-sm">Target: {mostRecentRound.target_score}</span>
              </div>
              
              {/* Data Point 3: Points Earned */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">{mostRecentRound.total_points} pts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`h-4 w-4 ${mostRecentRound.four_points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-medium ${mostRecentRound.four_points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {mostRecentRound.four_points_earned >= 0 ? '+' : ''}{mostRecentRound.four_points_earned}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Rounds Summary - SIMPLIFIED */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Rounds ({pastRounds.length})</span>
            {pastRounds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/rounddata')}
              >
                View All Details
              </Button>
            )}
          </CardTitle>
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
            <div className="space-y-2">
              {pastRounds.map((round) => (
                <div
                  key={round.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push(`/rounddata?roundId=${round.id}`)}
                >
                  <div>
                    <h4 className="font-medium">{round.course_name}</h4>
                    <p className="text-sm text-gray-600">
                      {round.tee_name} • {formatDate(round.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{round.total_points} pts</p>
                    <p className="text-sm text-gray-600">
                      {round.four_points_earned >= 0 ? '+' : ''}{round.four_points_earned}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waitlist - KEPT as requested */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Availability</CardTitle>
        </CardHeader>
        <CardContent>
          {!waitlist ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't set your availability yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p><span className="font-semibold">1st Choice:</span> {waitlist.avail_1}</p>
              {waitlist.avail_2 && <p><span className="font-semibold">2nd Choice:</span> {waitlist.avail_2}</p>}
              {waitlist.avail_3 && <p><span className="font-semibold">3rd Choice:</span> {waitlist.avail_3}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
