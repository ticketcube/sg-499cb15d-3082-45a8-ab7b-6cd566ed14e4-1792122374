
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/4points-logo.svg"
            alt="4Points Golf"
            width={200}
            height={150}
            priority
          />
        </div>

        {/* Quick Start Game Button */}
        <Card className="mb-8 p-6 text-center">
          <Button 
            size="lg"
            className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
          >
            Start New Game
          </Button>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="p-6 text-lg border-2"
          >
            Join Game
          </Button>
          <Button 
            variant="outline" 
            className="p-6 text-lg border-2"
          >
            Leaderboard
          </Button>
        </div>
      </div>
    </main>
  );
}
