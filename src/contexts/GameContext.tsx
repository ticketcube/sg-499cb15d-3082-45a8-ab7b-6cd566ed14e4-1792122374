import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GameSettings, HoleScore } from "@/types";

interface GameContextType {
  gameSettings: GameSettings | null;
  setGameSettings: (settings: GameSettings) => void;
  holeScores: HoleScore[];
  setHoleScore: (hole: number, score: number, points: number) => void;
  currentNine: "front" | "back";
  switchToBackNine: () => void;
  frontNineCompleted: boolean;
  totalPoints: number;
  fourPointsEarned: number;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [currentNine, setCurrentNine] = useState<"front" | "back">("front");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load game state from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedGameSettings = localStorage.getItem('currentGameSettings');
      const savedHoleScores = localStorage.getItem('currentHoleScores');
      const savedCurrentNine = localStorage.getItem('currentNine');

      if (savedGameSettings) {
        setGameSettings(JSON.parse(savedGameSettings));
      }
      if (savedHoleScores) {
        setHoleScores(JSON.parse(savedHoleScores));
      }
      if (savedCurrentNine) {
        setCurrentNine(JSON.parse(savedCurrentNine));
      }
    } catch (error) {
      console.error('Error loading game state from localStorage:', error);
    }
    
    setIsLoaded(true);
  }, []);

  // Save game state to localStorage whenever it changes (only after initial load and client-side)
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      if (gameSettings) {
        localStorage.setItem('currentGameSettings', JSON.stringify(gameSettings));
      } else {
        localStorage.removeItem('currentGameSettings');
      }
    } catch (error) {
      console.error('Error saving game settings to localStorage:', error);
    }
  }, [gameSettings, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('currentHoleScores', JSON.stringify(holeScores));
    } catch (error) {
      console.error('Error saving hole scores to localStorage:', error);
    }
  }, [holeScores, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('currentNine', JSON.stringify(currentNine));
    } catch (error) {
      console.error('Error saving current nine to localStorage:', error);
    }
  }, [currentNine, isLoaded]);

  const setHoleScore = (hole: number, score: number, points: number) => {
    setHoleScores(prev => {
      const existing = prev.findIndex(s => s.hole === hole);
      if (existing !== -1) {
        const newScores = [...prev];
        newScores[existing] = { hole, score, points };
        return newScores;
      }
      return [...prev, { hole, score, points }];
    });
  };

  const frontNineCompleted = holeScores.filter(s => s.hole <= 9 && s.points >= 0).length === 9;
  
  const totalPoints = holeScores.reduce((sum, score) => sum + score.points, 0);
  const fourPointsEarned = gameSettings 
    ? totalPoints - gameSettings.targetScore 
    : 0;

  const switchToBackNine = () => setCurrentNine("back");

  const resetGame = () => {
    setGameSettings(null);
    setHoleScores([]);
    setCurrentNine("front");
    setIsLoaded(false);
    
    // Clear localStorage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('currentGameSettings');
        localStorage.removeItem('currentHoleScores');
        localStorage.removeItem('currentNine');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
    
    setIsLoaded(true);
  };

  return (
    <GameContext.Provider value={{
      gameSettings,
      setGameSettings,
      holeScores,
      setHoleScore,
      currentNine,
      switchToBackNine,
      frontNineCompleted,
      totalPoints,
      fourPointsEarned,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
