
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flag, Award, Trophy, Users } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className='py-12 md:py-20 bg-gradient-to-b from-green-50 to-white'>
        <div className='container px-4 md:px-6'>
          <div className='flex flex-col items-center text-center space-y-4'>
            <div className='relative h-24 md:h-32 w-auto'>
              <Image 
                src='/4points-logo.svg' 
                alt='Golf 4Points Logo' 
                width={128} 
                height={128} 
                className='h-full w-auto'
                priority
              />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Golf 4Points
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-[700px]">
              A fast, fun, and fair golf gaming experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/game">
                <Button size="lg" className="text-lg">
                  Start Game
                </Button>
              </Link>
              <Link href="/leaderboard/daily">
                <Button variant="outline" size="lg" className="text-lg">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-[700px]">
              Golf 4Points makes scoring simple and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Flag className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold">1. Select Course</h3>
              <p className="text-muted-foreground">
                Choose your course and tees, then enter your GHIN index or average score
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Award className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold">2. Play & Score</h3>
              <p className="text-muted-foreground">
                Tap to score each hole: Bogey (1pt), Par (2pts), Birdie (3pts), Eagle (4pts)
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-100 rounded-full">
                <Trophy className="h-8 w-8 text-red-700" />
              </div>
              <h3 className="text-xl font-bold">3. Earn Points</h3>
              <p className="text-muted-foreground">
                Your 4Points score is calculated based on your performance vs. target
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <Users className="h-8 w-8 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold">4. Compete & Win</h3>
              <p className="text-muted-foreground">
                Climb the leaderboards and redeem your points for exciting prizes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Golf 4Points Rules</h2>
            <p className="text-xl text-muted-foreground max-w-[700px]">
              Simple scoring that makes every hole count
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Scoring System</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">Bogey:</span> 1 point
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">Par:</span> 2 points
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-red-600">Birdie:</span> 3 points
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-purple-600">Eagle:</span> 4 points
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-black">Bogey+:</span> 0 points
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Target Score Calculation</h3>
              <p className="mb-4">Your target score is calculated based on:</p>
              <ul className="space-y-2">
                <li className="text-sm">
                  <span className="font-semibold">GHIN Index:</span> 36 - (Index × (Slope ÷ 113)) + (Course Rating - Par)
                </li>
                <li className="text-sm">
                  <span className="font-semibold">Average Score:</span> 35 - ((Avg. Hole Score - 2.5) × (Slope ÷ 113)) + (Course Rating - Par)
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Leaderboards</h3>
              <ul className="space-y-2">
                <li>
                  <span className="font-semibold">Daily:</span> Resets at midnight with top 3 earning bonus points
                </li>
                <li>
                  <span className="font-semibold">Weekly:</span> Resets every Sunday with larger bonus rewards
                </li>
                <li>
                  <span className="font-semibold">Annual:</span> Tracks cumulative performance throughout the year
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Bonus Points</h3>
              <ul className="space-y-2">
                <li>
                  <span className="font-semibold">Daily Leaders:</span> 1st (18pts), 2nd (10pts), 3rd (8pts)
                </li>
                <li>
                  <span className="font-semibold">Referrals:</span> 18 points for each new golfer who completes a game
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">Ready to Play?</h2>
            <p className="text-xl text-muted-foreground max-w-[700px]">
              Start playing, earning points, and competing with friends today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/game">
                <Button size="lg" className="text-lg">
                  Start Game
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg" className="text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
