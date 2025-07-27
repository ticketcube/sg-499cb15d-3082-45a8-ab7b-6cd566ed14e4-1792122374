import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    totalPoints,
    fourPointsEarned,
    resetGame
  } = useGame();
  const { toast } = useToast();
  
  const [gameMode, setGameMode] = useState<'setup' | 'play'>('setup');
  const [setupStep, setSetupStep] = useState<'course' | 'tee'>('course');
  
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
    setSetupStep('tee');
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
    console.log('=== COMPLETE GAME BUTTON CLICKED ===');
    console.log('Game Settings:', gameSettings);
    console.log('Hole Scores:', holeScores);
    console.log('Current Nine:', currentNine);
    
    if (!gameSettings) {
      console.log('❌ No game settings - redirecting to setup');
      return;
    }

    // Log all hole scores with details
    console.log('All Hole Scores Details:');
    holeScores.forEach(score => {
      console.log(`Hole ${score.hole}: Score=${score.score}, Points=${score.points}`);
    });

    const scoredHoles = holeScores.filter(s => s.points >= 0);
    console.log('Scored Holes Count:', scoredHoles.length);
    console.log('Game Type (holes):', gameSettings.holes);

    // Simple completion check with detailed logging
    let canComplete = false;
    
    if (gameSettings.holes === 9) {
      // For 9-hole games, need all 9 holes scored
      const frontNineScored = holeScores.filter(s => s.hole <= 9 && s.points >= 0).length;
      console.log('9-hole game - Front nine scored:', frontNineScored);
      canComplete = frontNineScored === 9;
      console.log('9-hole completion check:', canComplete);
    } else if (gameSettings.holes === 18) {
      // For 18-hole games, need to be on back nine and have all 18 holes scored
      const frontNineScored = holeScores.filter(s => s.hole <= 9 && s.points >= 0).length;
      const backNineScored = holeScores.filter(s => s.hole >= 10 && s.hole <= 18 && s.points >= 0).length;
      const totalScored = holeScores.filter(s => s.points >= 0).length;
      
      console.log('18-hole game details:');
      console.log('- Front nine scored:', frontNineScored);
      console.log('- Back nine scored:', backNineScored);
      console.log('- Total scored:', totalScored);
      console.log('- Current nine:', currentNine);
      
      canComplete = currentNine === "back" && totalScored === 18;
      console.log('18-hole completion check:', canComplete);
    }

    console.log('Final Can Complete:', canComplete);

    if (canComplete) {
      console.log('✅ NAVIGATING TO /game/complete');
      try {
        await router.push("/game/complete");
        console.log('✅ Navigation completed successfully');
      } catch (error) {
        console.error('❌ Navigation failed:', error);
      }
    } else {
      console.log('❌ Game not complete yet - showing toast');
      toast({
        title: "Game not complete",
        description: gameSettings.holes === 9 
          ? "Please score all 9 holes to complete the game."
          : "Please score all 18 holes to complete the game.",
      });
    }
  };
  
  const handleNewGame = () => {
    resetGame();
    setGameMode("setup");
    setSetupStep("course");
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
  
  const handleBackToCourseSelection = () => {
    setSetupStep('course');
    setSelectedCourse(null);
    setSelectedTeeId("");
    setTargetScore(null);
    setGhinIndex("");
    setAverageScore("");
  };
  
  const renderSetupUI = () => (
    <div className="p-4 pt-6">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-lg">
            {setupStep === 'course' ? 'Select Course' : `${selectedCourse?.name} - Select Tees`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupStep === 'course' ? (
            <div className="space-y-3">
              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => {
                        if (typeof window.navigator.vibrate === "function") {
                          window.navigator.vibrate(10);
                        }
                        handleCourseChange(course.id);
                      }}
                      className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 hover:shadow-md border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 p-2"
                    >
                      <h3 className="font-bold text-sm text-center leading-tight">{course.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{course.holes}H</p>
                      <p className="text-xs text-gray-600">Par {course.par}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Select Tees</Label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedCourse?.tees.map(tee => (
                    <button
                      key={tee.id}
                      onClick={() => {
                        if (typeof window.navigator.vibrate === "function") {
                          window.navigator.vibrate(10);
                        }
                        handleTeeChange(tee.id);
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 hover:shadow-md p-2 relative ${
                        selectedTeeId === tee.id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <h3 className="font-bold text-sm text-center leading-tight">{tee.name}</h3>
                      <p className="text-xs text-gray-700 mt-1">CR: {tee.courseRating}</p>
                      <p className="text-xs text-gray-700">SR: {tee.slopeRating}</p>
                      {selectedTeeId === tee.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
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
                  
                  {targetScore !== null && (
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="font-medium">Target Score: <span className="text-xl font-bold">{targetScore}</span></p>
                    </div>
                  )}
                </>
              )}
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                size="lg" 
                disabled={!isFormValid} 
                onClick={handleStartGame}
              >
                Start New Game
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full" 
                onClick={handleBackToCourseSelection}
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  const renderPlayUI = () => {
    if (!gameSettings) return null;
    
    const holesToShow = currentNine === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

    // Calculate completion status directly here
    let showCompleteButton = false;
    if (gameSettings.holes === 9) {
      // For 9-hole games, need all 9 holes scored
      const frontNineScored = holeScores.filter(s => s.hole <= 9 && s.points >= 0).length;
      showCompleteButton = frontNineScored === 9;
    } else if (gameSettings.holes === 18) {
      // For 18-hole games, need to be on back nine and have all 18 holes scored
      const totalScored = holeScores.filter(s => s.points >= 0).length;
      showCompleteButton = currentNine === "back" && totalScored === 18;
    }

    return (
      <div className="p-3 pt-4 pb-6 flex flex-col min-h-screen">
        <Card className="max-w-sm mx-auto w-full">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">{gameSettings.courseName}</CardTitle>
            <p className="text-gray-700 text-sm font-medium">{gameSettings.teeName}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {holesToShow.map(hole => {
                const { text, color, bg, points } = getScoreDisplay(hole);
                return (
                  <button
                    key={hole}
                    onClick={() => handleHoleTap(hole)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors ${color} ${bg}`}
                  >
                    <span className="text-xl font-bold">{text}</span>
                    {points !== undefined && <span className="text-xs">{points} pts</span>}
                    {points === undefined && <span className="text-xs text-gray-600">Hole {hole}</span>}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-around items-center text-center">
                <div>
                  <p className="text-xs font-medium text-gray-700">Total</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Target</p>
                  <p className="text-lg font-bold">{gameSettings.targetScore}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">4Points</p>
                  <p className={`text-lg font-bold ${fourPointsEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fourPointsEarned >= 0 ? '+' : ''}{fourPointsEarned}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="max-w-sm mx-auto w-full mt-4 space-y-2">
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
          
          {showCompleteButton && (
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
      <div className="bg-white min-h-screen flex flex-col">
        {gameMode === "setup" ? renderSetupUI() : renderPlayUI()}
      </div>
    </Layout>
  );
}
