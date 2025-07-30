import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Game, Profile } from "@/types";
import { useRouter } from "next/router";
import { User } from "lucide-react";

export default function PublicProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pastRounds, setPastRounds] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && typeof userId === "string") {
      loadPublicProfileData(userId);
    }
  }, [userId]);

  const loadPublicProfileData = async (profileUserId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load public profile info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, created_at")
        .eq("id", profileUserId)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          setError("Profile not found");
        } else {
          throw profileError;
        }
        return;
      }

      if (profileData) {
        setProfile({ ...profileData, id: profileUserId });
      }

      // Load public past rounds (no sensitive data)
      const { data: games, error: gamesError } = await supabase
        .from("games")
        .select("id, course_name, tee_name, total_points, four_points_earned, created_at")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (gamesError) {
        console.error("Error fetching past rounds:", gamesError);
      } else {
        setPastRounds(games as Game[]);
      }
    } catch (error) {
      console.error("Error loading public profile data:", error);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="py-8 px-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600">{error}</p>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        {/* Public Profile Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {profile?.display_name || "Golf Player"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Member Since</label>
              <p className="text-gray-900">
                {new Date(profile?.created_at).toLocaleDateString()}
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

        {/* Public Past Rounds */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Rounds ({pastRounds.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pastRounds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No rounds played yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastRounds.map((round) => (
                  <div
                    key={round.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{round.course_name}</h4>
                      <p className="text-sm text-gray-600">
                        {round.tee_name} • {new Date(round.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{round.total_points} pts</p>
                      <p className="text-sm text-gray-600">
                        {round.four_points_earned} 4-points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
