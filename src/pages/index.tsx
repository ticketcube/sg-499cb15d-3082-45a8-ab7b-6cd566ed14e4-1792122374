
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flag, Award, Trophy, Users } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className='py-8 bg-gradient-to-b from-green-50 to-white'>
        <div className='px-4'>
          <div className='flex flex-col items-center text-center space-y-4'>
            <div className='relative h-20 w-auto'>
              <Image 
                src='/4points-m91nnzka.png' 
                alt='Golf 4Points Logo' 
                width={80} 
                height={80} 
                className='h-full w-auto'
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">
              Golf 4Points
            </h1>
            <p className="text-lg text-muted-foreground">
              A fast, fun, and fair golf gaming experience
            </p>
            <div className="flex flex-col w-full gap-3 mt-4">
              <Link href="/game" className="w-full">
                <Button size="lg" className="w-full h-14 text-lg rounded-xl">
                  Start Game
                </Button>
              </Link>
              <Link href="/leaderboard/daily" className="w-full">
                <Button variant="outline" size="lg" className="w-full h-14 text-lg rounded-xl">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <h2 className="text-xl font-bold tracking-tighter">How It Works</h2>
            <p className="text-base text-muted-foreground">
              Golf 4Points makes scoring simple and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-green-100 rounded-full">
                <Flag className="h-6 w-6 text-green-700" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-lg font-bold">1. Select Course</h3>
                <p className="text-sm text-muted-foreground">
                  Choose course, tees & enter GHIN/avg score
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-lg font-bold">2. Play & Score</h3>
                <p className="text-sm text-muted-foreground">
                  Tap to score: Bogey 1pt, Par 2pts, Birdie 3pts
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-red-100 rounded-full">
                <Trophy className="h-6 w-6 text-red-700" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-lg font-bold">3. Earn Points</h3>
                <p className="text-sm text-muted-foreground">
                  Score based on performance vs. target
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-lg font-bold">4. Compete & Win</h3>
                <p className="text-sm text-muted-foreground">
                  Climb leaderboards, earn rewards
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-8 bg-slate-50">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <h2 className="text-xl font-bold tracking-tighter">Scoring Rules</h2>
            <p className="text-base text-muted-foreground">
              Simple scoring that makes every hole count
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-3">Points Per Score</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="font-medium">Bogey</span>
                  <span className="text-green-600">1 pt</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="font-medium">Par</span>
                  <span className="text-blue-600">2 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <span className="font-medium">Birdie</span>
                  <span className="text-red-600">3 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="font-medium">Eagle</span>
                  <span className="text-purple-600">4 pts</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-3">Daily Rewards</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>1st Place</span>
                  <span className="font-semibold text-green-600">18 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>2nd Place</span>
                  <span className="font-semibold text-blue-600">10 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>3rd Place</span>
                  <span className="font-semibold text-purple-600">8 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-bold tracking-tighter">Ready to Play?</h2>
            <p className="text-base text-muted-foreground">
              Start playing and earning points today
            </p>
            <div className="flex flex-col w-full gap-3 mt-2">
              <Link href="/game" className="w-full">
                <Button size="lg" className="w-full h-14 text-lg rounded-xl">
                  Start Game
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full">
                <Button variant="outline" size="lg" className="w-full h-14 text-lg rounded-xl">
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
