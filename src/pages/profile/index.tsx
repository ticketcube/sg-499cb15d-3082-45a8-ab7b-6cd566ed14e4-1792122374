
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trophy, TrendingUp, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";
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

const [waitlist, setWaitlist] = useState < {
    avail_1: string;
    avail_2?: string | null;
    avail_3?: string | null;
} | null > (null);


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pastRounds, setPastRounds] = useState<PlayerRound[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load profile
      const profileData = await userService.getProfile(user.id);
      setProfile(profileData);
      setDisplayName(profileData?.display_name || user.email?.split("@")[0] || "");

      // Load past rounds with detailed information
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
        console.error("Error fetching past rounds:", error);
      } else {
        setPastRounds(games as PlayerRound[]);
      }
    } catch (error) {
      console.error("Error loading profile ", error);
    } finally {
      setIsLoading(false);
    }
      // Load waitlist data
      const { data: waitlistData, error: waitlistError } = await supabase
          .from("waitlist")
          .select("avail_1, avail_2, avail_3")
          .eq("id", user.id)
          .maybeSingle();

      if (waitlistError) {
          console.error("Error fetching waitlist:", waitlistError);
      } else {
          setWaitlist(waitlistData);
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

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) return;

    try {
      setIsSaving(true);
      await userService.updateProfile(user.id, displayName.trim());
      setProfile(prev => ({ ...prev, display_name: displayName.trim() }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.display_name || user?.email?.split("@")[0] || "");
    setIsEditing(false);
  };

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
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Profile</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Display Name</label>
            {isEditing ? (
              <div className="flex gap-2 mt-1">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving || !displayName.trim()}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-gray-900">
                {profile?.display_name || user.email?.split("@")[0] || "Not set"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Total Points</label>
            <p className="text-2xl font-bold text-green-600">
              {pastRounds.reduce((total, round) => total + (round.total_points || 0), 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Past Rounds */}
      <Card>
        <CardHeader>
          <CardTitle>Past Rounds ({pastRounds.length})</CardTitle>
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
                <Card key={round.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold">{round.course_name}</h3>
                        <p className="text-sm text-muted-foreground">{round.tee_name} Tees</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(round.created_at)}</span>
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

          {/* WaitList */}
          {/* Waitlist */}
          <Card className="mt-6">
              <CardHeader>
                  <CardTitle>Waitlist Availability</CardTitle>
              </CardHeader>
              <CardContent>
                  {!waitlist ? (
                      <div className="text-center py-8 text-gray-500">
                          <p>You haven’t set your availability yet.</p>
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
