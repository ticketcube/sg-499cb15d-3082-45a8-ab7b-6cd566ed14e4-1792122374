
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calendar, Target, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";

interface Player {
  id: string;
  player_name: string;
  total_games: number;
  latest_game: string;
}

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

export default function PlayersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerRounds, setPlayerRounds] = useState<PlayerRound[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("player_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by player and get stats
      const playerMap = new Map();
      data?.forEach(game => {
        const playerName = game.player_name;
        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, {
            id: playerName.toLowerCase().replace(/\s+/g, "-"),
            player_name: playerName,
            total_games: 0,
            latest_game: game.created_at
          });
        }
        const player = playerMap.get(playerName);
        player.total_games += 1;
        if (new Date(game.created_at) > new Date(player.latest_game)) {
          player.latest_game = game.created_at;
        }
      });

      const playersArray = Array.from(playerMap.values()).sort((a, b) => 
        b.total_games - a.total_games
      );

      setPlayers(playersArray);
      setFilteredPlayers(playersArray);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load players list."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerRounds = async (playerName: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to view player details."
      });
      return;
    }

    setLoadingRounds(true);
    try {
      const { data, error } = await supabase
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
        .eq("player_name", playerName)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlayerRounds(data || []);
    } catch (error) {
      console.error("Error fetching player rounds:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load player rounds."
      });
    } finally {
      setLoadingRounds(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    fetchPlayerRounds(player.player_name);
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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading players...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Players</h1>
          <p className="text-muted-foreground">
            Browse and search for players to view their game history
          </p>
        </div>

        {!selectedPlayer ? (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search players by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlayers.map((player) => (
                <Card 
                  key={player.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{player.player_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{player.total_games} games</span>
                          <span>Last: {formatDate(player.latest_game)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No players found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedPlayer.player_name}</h2>
                <p className="text-muted-foreground">Past Rounds</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedPlayer(null);
                  setPlayerRounds([]);
                }}
              >
                Back to Players
              </Button>
            </div>

            {loadingRounds ? (
              <div className="text-center py-8">Loading rounds...</div>
            ) : (
              <div className="space-y-4">
                {playerRounds.map((round) => (
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

                {playerRounds.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No rounds found for this player.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
