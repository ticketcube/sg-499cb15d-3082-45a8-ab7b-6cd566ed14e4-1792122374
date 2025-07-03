
import { createContext, useContext, useState, ReactNode } from "react";
import { GameSettings, HoleScore, scoreOptions } from "@/types";

interface GameContextType {
  gameSettings: GameSettings | null;
  setGameSettings: (settings: GameSettings) => void;
  holeScores: HoleScore[];
  setHoleScore: (hole: number, score: number, points: number) => void;
  currentNine: "front" | "back";
  switchToBackNine: () => void;
  frontNineCompleted: boolean;
  allHolesScored: boolean;
  totalPoints: number;
  fourPointsEarned: number;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [currentNine, setCurrentNine] = useState<"front" | "back">("front");

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

  const frontNineCompleted = holeScores.filter(s => s.hole <= 9).length === 9;
  const allHolesScored = gameSettings?.holes === 9 
    ? holeScores.length === 9 
    : holeScores.length === 18;

  const totalPoints = holeScores.reduce((sum, score) => sum + score.points, 0);
  const fourPointsEarned = gameSettings 
    ? totalPoints - gameSettings.targetScore 
    : 0;

  const switchToBackNine = () => setCurrentNine("back");

  const resetGame = () => {
    setGameSettings(null);
    setHoleScores([]);
    setCurrentNine("front");
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
      allHolesScored,
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
