
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { surveyService } from "@/services/surveyService";
import Link from "next/link";
import Image from 'next/image';

type ViewMode = 'home' | 'how-it-works' | 'game-rules';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingSurvey, setCheckingSurvey] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('home');

  useEffect(() => {
    const checkSurveyStatus = async () => {
      try {
        if (!user) {
          // If no user, redirect to survey (home page)
          router.push('/survey');
          return;
        }
        
        const hasCompletedSurvey = await surveyService.checkIfSurveyCompleted(user.id);
        if (!hasCompletedSurvey) {
          router.push('/survey');
          return;
        }
      } catch (error) {
        console.error('Error checking survey status:', error);
      } finally {
        setCheckingSurvey(false);
      }
    };

    if (!loading) {
      checkSurveyStatus();
    }
  }, [loading, user, router]);

  if (loading || checkingSurvey) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const renderHomeView = () => (
    <>
      <section className='py-12 bg-white'>
        <div className='px-4'>
          <div className='flex flex-col items-center text-center space-y-6'>
            <Link href="/game">
              <div className='bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:border-green-300'>
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
                  <h1 className="text-xl font-bold text-red-600">
                    Tap To Play!
                  </h1>
                </div>
              </div>
            </Link>

            <p className="text-base text-gray-600 font-medium">
              Tap the Square to Start Playing Now!
            </p>

            <div className="flex gap-3 w-full max-w-xs">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-sm"
                onClick={() => setCurrentView('how-it-works')}
              >
                How It Works
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-sm"
                onClick={() => setCurrentView('game-rules')}
              >
                Game Rules
              </Button>
            </div>

            <div className="w-full max-w-xs">
              <Link href="/leaderboard/monthly" className="w-full">
                <Button size="sm" className="w-full text-sm rounded-lg bg-green-600 hover:bg-green-700">
                  View Leaderboards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderHowItWorksView = () => (
    <section className="py-8 bg-gray-50 min-h-screen flex flex-col">
      <div className="px-4 flex-grow">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <h2 className="text-xl font-bold tracking-tighter">How It Works</h2>
          <p className="text-base text-muted-foreground">
            Golf 4Points makes scoring simple and rewarding
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
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

      <div className="px-4 pb-8">
        <div className="flex flex-col w-full gap-3 max-w-sm mx-auto">
          <Link href="/game" className="w-full">
            <Button size="lg" className="w-full h-12 text-base rounded-xl bg-green-600 hover:bg-green-700">
              Start Game
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-12 text-base rounded-xl"
            onClick={() => setCurrentView('game-rules')}
          >
            Game Rules
          </Button>
        </div>
      </div>
    </section>
  );

  const renderGameRulesView = () => (
    <section className="py-8 bg-white min-h-screen flex flex-col">
      <div className="px-4 flex-grow">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <h2 className="text-xl font-bold tracking-tighter">Game Rules</h2>
          <p className="text-base text-muted-foreground">
            Simple scoring that makes every hole count
          </p>
        </div>

        <div className="space-y-4 mb-4">
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

      <div className="px-4 pb-8">
        <div className="flex flex-col w-full gap-3 max-w-sm mx-auto">
          <Link href="/game" className="w-full">
            <Button size="lg" className="w-full h-12 text-base rounded-xl bg-green-600 hover:bg-green-700">
              Start Game
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-12 text-base rounded-xl"
            onClick={() => setCurrentView('how-it-works')}
          >
            How It Works
          </Button>
        </div>
      </div>
    </section>
  );

  return (
    <Layout>
      {currentView === 'home' && renderHomeView()}
      {currentView === 'how-it-works' && renderHowItWorksView()}
      {currentView === 'game-rules' && renderGameRulesView()}
    </Layout>
  );
}
