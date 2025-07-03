import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/router";
import { useGame } from "@/contexts/GameContext";
import { scoreOptions, Course, GameSettings } from "@/types";
import { courseService } from "@/services/courseService";
import { gameService } from "@/services/gameService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GamePage() {
  const router = useRouter();
  const { 
    gameSettings, 
    setGameSettings,
    holeScores, 
    setHoleScore, 
    currentNine, 
    switchToBackNine: contextSwitchToBackNine, 
    frontNineCompleted,
    allHolesScored,
    totalPoints,
    fourPointsEarned,
    resetGame
  } = useGame();
  const { toast } = useToast();
  
  const [gameMode, setGameMode] = useState<'setup' | 'play'>('setup');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTeeId, setSelectedTeeId] = useState<string>('');
  const [ghinIndex, setGhinIndex] = useState<string>("");
  const [averageScore, setAverageScore] = useState<string>("");
  const [scoreType, setScoreType] = useState<'ghin' | 'average'>('ghin');
  const [loading, setLoading] = useState(true);
  const [targetScore, setTargetScore] = useState<number | null>(null);
  
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch courses'
      });
    }
  }, [toast]);
  
  useEffect(() => {
    if (gameSettings) {
      setGameMode('play');
    } else {
      setGameMode('setup');
      fetchCourses();
    }
  }, [gameSettings, fetchCourses]);
  
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    setSelectedCourse(course);
    setSelectedTeeId("");
    setTargetScore(null);
  };
  
  const handleTeeChange = (teeId: string) => {
    setSelectedTeeId(teeId);
    calculateTargetScore(teeId, scoreType === 'ghin' ? ghinIndex : undefined, scoreType === 'average' ? averageScore : undefined);
  };
  
  const handleScoreTypeChange = (type: "ghin" | "average") => {
    setScoreType(type);
    setGhinIndex("");
    setAverageScore("");
    setTargetScore(null);
  };
  
  const handleGhinIndexChange = (value: string) => {
    setGhinIndex(value);
    calculateTargetScore(selectedTeeId, value, undefined);
  };
  
  const handleAverageScoreChange = (value: string) => {
    setAverageScore(value);
    calculateTargetScore(selectedTeeId, undefined, value);
  };
  
  const calculateTargetScore = (teeId: string, ghin?: string, avg?: string) => {
    if (!selectedCourse || !teeId) return;
    
    const selectedTee = selectedCourse.tees.find(t => t.id === teeId);
    if (!selectedTee) return;

    const ghinValue = ghin !== undefined ? parseFloat(ghin) : undefined;
    const avgValue = avg !== undefined ? parseInt(avg) : undefined;

    if (scoreType === "ghin" && (ghinValue === undefined || isNaN(ghinValue))) {
      setTargetScore(null);
      return;
    }
    if (scoreType === "average" && (avgValue === undefined || isNaN(avgValue))) {
      setTargetScore(null);
      return;
    }
    
    try {
      let target = gameService.calculateTargetScore({
        ghinIndex: ghinValue,
        averageScore: avgValue,
        slopeRating: selectedTee.slopeRating,
        courseRating: selectedTee.courseRating,
        par: selectedCourse.par
      });

      if (selectedCourse.holes === 9) {
        target = target / 2;
      }
      
      setTargetScore(Math.round(target));
    } catch (error) {
      console.error("Error calculating target score:", error);
      setTargetScore(null);
    }
  };
  
  const handleStartGame = () => {
    if (!selectedCourse || !selectedTeeId || targetScore === null) return;
    
    const selectedTee = selectedCourse.tees.find(t => t.id === selectedTeeId);
    if (!selectedTee) return;
    
    const newGameSettings: GameSettings = {
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTeeId,
      teeName: selectedTee.name,
      par: selectedCourse.par,
      slopeRating: selectedTee.slopeRating,
      courseRating: selectedTee.courseRating,
      ghinIndex: scoreType === "ghin" ? parseFloat(ghinIndex) : undefined,
      averageScore: scoreType === "average" ? parseInt(averageScore) : undefined,
      targetScore: targetScore,
      holes: selectedCourse.holes
    };
    
    setGameSettings(newGameSettings);
    setGameMode("play");
  };
  
  const handleHoleTap = (hole: number) => {
    if (typeof window.navigator.vibrate === "function") {
      window.navigator.vibrate(10);
    }
    const existingScore = holeScores.find(score => score.hole === hole);
    const currentTaps = existingScore ? existingScore.score : 0;
    const nextTaps = (currentTaps % 5) + 1;
    
    const scoreOption = scoreOptions.find(option => option.taps === nextTaps);
    
    if (scoreOption) {
      setHoleScore(hole, nextTaps, scoreOption.points);
    }
  };
  
  const getScoreDisplay = (hole: number) => {
    const score = holeScores.find(s => s.hole === hole);
    
    if (!score || score.score === 0 || score.points === 0) {
      const scoreOptionReset = scoreOptions.find(option => option.taps === 5);
      if (score && scoreOptionReset && score.score === scoreOptionReset.taps) {
        return { text: "+", color: scoreOptionReset.color, bg: scoreOptionReset.bg, points: 0 };
      }
      return { text: hole.toString(), color: "text-gray-800", bg: "bg-gray-100", points: undefined };
    }
    
    const scoreOption = scoreOptions.find(option => option.taps === score.score);
    
    if (scoreOption) {
      return { 
        text: scoreOption.type, 
        color: scoreOption.color,
        bg: scoreOption.bg,
        points: scoreOption.points
      };
    }
    
    return { text: hole.toString(), color: "text-gray-800", bg: "bg-gray-100", points: undefined };
  };
  
  const handleCompleteGame = async () => {
    if (!gameSettings || !allHolesScored) {
      console.log('Cannot complete game:', {
        hasGameSettings: !!gameSettings,
        allHolesScored,
        gameType: gameSettings?.holes,
        totalHolesScored: holeScores.filter(s => s.points >= 0).length,
        requiredHoles: gameSettings?.holes || 0,
        currentNine,
        frontNineCompleted
      });
      return;
    }
    
    // For 9-hole games, or completed 18-hole games, proceed to completion
    router.push("/game/complete");
  };
  
  const handleNewGame = () => {
    resetGame();
    setGameMode("setup");
    setSelectedCourse(null);
    setSelectedTeeId("");
    setGhinIndex("");
    setAverageScore("");
    setTargetScore(null);
  };

  const switchToBackNine = () => {
    contextSwitchToBackNine();
  };
  
  const isFormValid = selectedCourse && selectedTeeId && targetScore !== null && 
    ((scoreType === "ghin" && ghinIndex !== "") || 
     (scoreType === "average" && averageScore !== ""));
  
  const renderSetupUI = () => (
    <div className="p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Game Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="course">Course</Label>
            <Select onValueChange={handleCourseChange} disabled={loading}>
              <SelectTrigger id="course">
                <SelectValue placeholder={loading ? "Loading..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.holes} holes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedCourse && (
            <div className="space-y-1">
              <Label htmlFor="tee">Tees</Label>
              <Select onValueChange={handleTeeChange} value={selectedTeeId}>
                <SelectTrigger id="tee">
                  <SelectValue placeholder="Select tees" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourse.tees.map(tee => (
                    <SelectItem key={tee.id} value={tee.id}>
                      {tee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedTeeId && (
            <>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant={scoreType === "ghin" ? "default" : "outline"}
                  onClick={() => handleScoreTypeChange("ghin")}
                  className="flex-1"
                >
                  GHIN
                </Button>
                <Button 
                  variant={scoreType === "average" ? "default" : "outline"}
                  onClick={() => handleScoreTypeChange("average")}
                  className="flex-1"
                >
                  Avg Score
                </Button>
              </div>
              
              {scoreType === "ghin" ? (
                <div className="space-y-1">
                  <Label htmlFor="ghin">GHIN Index</Label>
                  <Input id="ghin" type="number" placeholder="e.g., 10.4" value={ghinIndex} onChange={(e) => handleGhinIndexChange(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="average">Average 18-Hole Score</Label>
                  <Input id="average" type="number" placeholder="e.g., 90" value={averageScore} onChange={(e) => handleAverageScoreChange(e.target.value)} />
                </div>
              )}
            </>
          )}
          
          {targetScore !== null && (
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="font-medium">Target Score: <span className="text-xl font-bold">{targetScore}</span></p>
            </div>
          )}
          
          <Button className="w-full" size="lg" disabled={!isFormValid} onClick={handleStartGame}>
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderPlayUI = () => {
    if (!gameSettings) return null;
    
    const holesToShow = currentNine === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

    return (
      <div className="p-2 sm:p-4 flex flex-col h-full">
        <Card className="max-w-md mx-auto flex-grow flex flex-col">
          <CardHeader className="text-center pb-2">
            <CardTitle>{gameSettings.courseName}</CardTitle>
            <p className="text-muted-foreground text-sm">{gameSettings.teeName}</p>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2">
              {holesToShow.map(hole => {
                const { text, color, bg, points } = getScoreDisplay(hole);
                return (
                  <button
                    key={hole}
                    onClick={() => handleHoleTap(hole)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors ${color} ${bg}`}
                  >
                    <span className="text-2xl font-bold">{text}</span>
                    {points !== undefined && <span className="text-xs">{points} pts</span>}
                    {points === undefined && <span className="text-xs text-gray-500">Hole {hole}</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-around items-center text-center">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Target</p>
                  <p className="text-xl font-bold">{gameSettings.targetScore}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">4Points</p>
                  <p className={`text-xl font-bold ${fourPointsEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fourPointsEarned >= 0 ? '+' : ''}{fourPointsEarned}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="max-w-md mx-auto w-full mt-4 space-y-2">
          {gameSettings.holes === 18 && currentNine === "front" && frontNineCompleted && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">Score Back Nine</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ready for the Back Nine?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You've scored all holes on the front nine. Continue to the back nine to complete your round.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Not Yet</AlertDialogCancel>
                  <AlertDialogAction onClick={switchToBackNine}>Let's Go</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {allHolesScored && (
            <Button onClick={handleCompleteGame} size="lg" className="w-full">
              Complete Game
            </Button>
          )}
          
          <Button onClick={handleNewGame} variant="outline" size="lg" className="w-full">
            New Game
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {gameMode === "setup" ? renderSetupUI() : renderPlayUI()}
      </div>
    </Layout>
  );
}
