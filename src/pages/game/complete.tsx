import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { gameService } from '@/services/gameService';
import { Game } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function GameCompletePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameId } = router.query;
  const { source } = router.query; // for survey completion flow
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (typeof gameId !== 'string') {
        if (source !== 'survey') {
          setError("No game ID provided.");
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedGame = await gameService.getGameById(gameId);
        setGame(fetchedGame);
      } catch (err) {
        console.error("Failed to fetch game:", err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && gameId) {
      fetchGame();
    } else if (source === 'survey') {
      setLoading(false);
    } else if (!user) {
        // wait for user context to load
    }
    else {
      setLoading(false);
    }
  }, [user, gameId, source]);

  const isFromSurvey = source === 'survey';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <Card className="w-full max-w-2xl p-6 md:p-10">
          <CardHeader>
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full mt-2 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:gap-8 text-center">
              <div>
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-1/4 mx-auto mt-2" />
              </div>
              <div>
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-1/4 mx-auto mt-2" />
              </div>
              <div>
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-1/4 mx-auto mt-2" />
              </div>
              <div>
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-1/4 mx-auto mt-2" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-6">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center text-center">
      <Card className="w-full max-w-2xl p-6 md:p-10">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">
            {isFromSurvey ? "You're All Set!" : "Round Complete!"}
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground mt-2">
            {isFromSurvey
              ? "Thank you for completing the survey. Your personalized experience is ready."
              : "Great job on finishing your round. Here's your summary."}
          </CardDescription>
        </CardHeader>
        
        {!isFromSurvey && game && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:gap-8 text-center mt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Course</p>
                <p className="text-2xl font-bold">{game.course_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{game.total_points}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">4 Points Earned</p>
                <p className="text-2xl font-bold">{game.four_points_earned}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-2xl font-bold">{new Date(game.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
                <p className="text-muted-foreground">
                    You can view your detailed game summary, check out the leaderboards, or start a new round.
                </p>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col items-center justify-center gap-4 mt-6">
          {isFromSurvey ? (
            <Button 
              onClick={() => router.push('/game')} 
              className="h-40 w-40 text-2xl font-bold whitespace-normal text-center rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started
            </Button>
          ) : (
            <>
              {gameId && <Button onClick={() => router.push(`/game/summary?gameId=${gameId}`)}>View Detailed Summary</Button>}
              <Button onClick={() => router.push('/game')}>Play Another Round</Button>
              <Button variant="outline" onClick={() => router.push('/leaderboard/monthly')}>
                View Leaderboard
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
    
