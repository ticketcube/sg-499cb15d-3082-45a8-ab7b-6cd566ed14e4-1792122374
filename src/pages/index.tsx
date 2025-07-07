
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - White Background */}
      <section className='py-12 bg-white'>
        <div className='px-4'>
          <div className='flex flex-col items-center text-center space-y-6'>
            {/* Logo in Square with Tap To Play */}
            <div className='bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg'>
              <div className='flex flex-col items-center space-y-4'>
                <div className='relative h-16 w-auto'>
                  <Image 
                    src='/4points-m91nnzka.png' 
                    alt='4Points Logo' 
                    width={64} 
                    height={64} 
                    className='h-full w-auto'
                    priority
                  />
                </div>
                <h1 className="text-xl font-bold text-green-600">
                  Tap To Play!
                </h1>
              </div>
            </div>

            {/* Two Small Buttons */}
            <div className="flex gap-3 w-full max-w-xs">
              <Link href="#how-it-works" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  How It Works
                </Button>
              </Link>
              <Link href="#game-rules" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  Game Rules
                </Button>
              </Link>
            </div>

            {/* Main CTA */}
            <div className="w-full max-w-sm">
              <Link href="/game" className="w-full">
                <Button size="lg" className="w-full h-14 text-lg rounded-xl bg-green-600 hover:bg-green-700">
                  Start Playing Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-8 bg-gray-50">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <h2 className="text-xl font-bold tracking-tighter">How It Works</h2>
            <p className="text-base text-muted-foreground">
              Golf 4Points makes scoring simple and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-green-100 rounded-full min-w-fit">
                <span className="text-green-700 font-bold text-lg">1</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-bold">Select Course & Tees</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your course and enter GHIN or average score
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-blue-100 rounded-full min-w-fit">
                <span className="text-blue-700 font-bold text-lg">2</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-bold">Tap to Score Each Hole</h3>
                <p className="text-sm text-muted-foreground">
                  Simple tapping interface for quick scoring
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-red-100 rounded-full min-w-fit">
                <span className="text-red-700 font-bold text-lg">3</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-bold">Earn Points</h3>
                <p className="text-sm text-muted-foreground">
                  Points based on performance vs. your target
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <div className="p-3 bg-purple-100 rounded-full min-w-fit">
                <span className="text-purple-700 font-bold text-lg">4</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="text-base font-bold">Compete & Win</h3>
                <p className="text-sm text-muted-foreground">
                  Climb leaderboards and earn rewards
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Rules Section */}
      <section id="game-rules" className="py-8 bg-white">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <h2 className="text-xl font-bold tracking-tighter">Game Rules</h2>
            <p className="text-base text-muted-foreground">
              Simple scoring that makes every hole count
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-lg font-bold mb-3">Points Per Score</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="font-medium">Bogey</span>
                  <span className="text-green-600 font-bold">1 pt</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="font-medium">Par</span>
                  <span className="text-blue-600 font-bold">2 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <span className="font-medium">Birdie</span>
                  <span className="text-red-600 font-bold">4 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="font-medium">Eagle+</span>
                  <span className="text-purple-600 font-bold">6 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg col-span-2">
                  <span className="font-medium">Double Bogey +</span>
                  <span className="text-gray-600 font-bold">0 pts</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
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

      {/* Final CTA Section */}
      <section className="py-8 bg-green-50">
        <div className="px-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-bold tracking-tighter">Ready to Start?</h2>
            <div className="flex flex-col w-full gap-3 mt-2 max-w-sm">
              <Link href="/game" className="w-full">
                <Button size="lg" className="w-full h-14 text-lg rounded-xl bg-green-600 hover:bg-green-700">
                  Play Now
                </Button>
              </Link>
              <Link href="/leaderboard/daily" className="w-full">
                <Button variant="outline" size="lg" className="w-full h-12 text-base rounded-xl">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
