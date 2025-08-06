import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from 'next/image';

type ViewMode = 'home' | 'how-it-works' | 'game-rules';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentView, setCurrentView] = useState < ViewMode > ('home');

    // Redirect unauthenticated users to survey
    useEffect(() => {
        if (!loading && !user) {
            router.push('/survey');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Show loading while redirecting unauthenticated users
    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderHomeView = () => (
        <div className="bg-white flex flex-col h-full">
            <section className='py-8 px-4 flex-grow'>
                <div className='flex flex-col items-center text-center space-y-6 max-w-sm mx-auto'>
                    <div className="relative w-24 h-24 mx-auto">
                        <Image
                            src="/full-4unders-logo-mddg489f.png"
                            alt="4Under Club Logo"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-green-700 text-center">
                            Club Misson
                        </h1>
                        <p className="text-lg text-gray-700">
                            The 4Under Club guarantees fast and fun rounds of golf by solving the two problems that slow down pace of play.
                        </p>

                        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                            <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                <span className="text-green-700 font-bold text-base">1</span>
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-sm font-bold">All It Takes Is One Slow Golfer</h3>
                                <p className="text-xs text-gray-700">
                                    It only takes one slow golfer to bottleneck an entire course.  If we all have the same mission, there will be no bottlenecks.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                            <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                <span className="text-green-700 font-bold text-base">2</span>
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-sm font-bold">All It Takes Is One Bad Hole </h3>
                                <p className="text-xs text-gray-700">
                                    Blow up holes ruin scores, attitudes and pace of play.
                                </p>
                            </div>
                        </div>

                    </div>


                    <div className="flex flex-col items-center space-y-3 mt-4">
                        <div className="flex gap-3 w-full max-w-xs">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                onClick={() => setCurrentView('how-it-works')}
                            >
                                Club Rules
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                onClick={() => setCurrentView('game-rules')}
                            >
                                Club Game
                            </Button>
                        </div>

                        <Link href="/game">
                            <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                <h1 className="text-xl font-bold">
                                    Tap To Start Game!
                                </h1>
                            </div>
                        </Link>
                    </div>



                </div>
            </section>
        </div>
    );

    const renderHowItWorksView = () => (
        <div className="bg-gray-50 flex flex-col h-full">
            <section className='py-8 px-4 flex-grow'>

                <div className="px-4 py-4">
                    <div className="max-w-sm mx-auto">
                        <div className="flex flex-col items-center text-center space-y-2 mb-4">
                            <h2 className="text-xl font-bold tracking-tighter">Club Rules</h2>
                            <p className="text-base text-gray-700">
                                The only requirement to join the 4Unders is that you agree to play and support our mission to play 18 holes of golf in under 4 hours.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-4">
                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                    <span className="text-green-700 font-bold text-base">1</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">Our Mission is Our Responsibility</h3>
                                    <p className="text-xs text-gray-700">
                                        Enforcement of pace of play is up to members, not marshals or other players.  If we all have the same mission, there will be no bottlenecks.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-blue-100 rounded-full min-w-fit">
                                    <span className="text-blue-700 font-bold text-base">2</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">Ready Golf Is Respectful Golf</h3>
                                    <p className="text-xs text-gray-700">
                                        Walking to an open tee box while a member is still lining up a putt for bogey is expected and polite.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-red-100 rounded-full min-w-fit">
                                    <span className="text-red-700 font-bold text-base">3</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">Fast and Fun Golf is NOT Speed Golf</h3>
                                    <p className="text-xs text-gray-700">
                                        Playing 18 holes of golf in under 4 hours is not Speed Golf.  There is plenty of time for talking on tee boxes, checking on side bets and getting another beverage.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-purple-100 rounded-full min-w-fit">
                                    <span className="text-purple-700 font-bold text-base">4</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">We Golf For Points, Not Strokes</h3>
                                    <p className="text-xs text-gray-700">
                                        For almost 200 years, golf has used a points based, not stroke play, scoring method that is fast and fun.  We play a modified version of this "Stableford" scoring system.  And we own the game.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center space-y-3 mt-4">
                            <div className="flex gap-3 w-full max-w-xs">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                    onClick={() => setCurrentView('how-it-works')}
                                >
                                    Club Rules
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                    onClick={() => setCurrentView('game-rules')}
                                >
                                    Club Game
                                </Button>
                            </div>

                            <Link href="/game">
                                <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                    <h1 className="text-xl font-bold">
                                        Tap To Start Game!
                                    </h1>
                                </div>
                            </Link>
                        </div>

                    </div>
                </div>
            </section>
        </div>

    );

    const renderGameRulesView = () => (
        <div className="bg-white flex flex-col h-full">
            <div className="px-4 py-4">
                <div className="max-w-sm mx-auto">
                    <div className="flex flex-col items-center text-center space-y-2 mb-4">
                        <h2 className="text-xl font-bold tracking-tighter">Game Rules</h2>
                        <p className="text-base text-gray-700">
                            Simple scoring that makes every hole count
                        </p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <h3 className="text-base font-bold mb-2">Points Per Score</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                    <span className="font-medium text-sm">Bogey</span>
                                    <span className="text-green-600 font-bold text-sm">1 pt</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                    <span className="font-medium text-sm">Par</span>
                                    <span className="text-blue-600 font-bold text-sm">2 pts</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                    <span className="font-medium text-sm">Birdie</span>
                                    <span className="text-red-600 font-bold text-sm">4 pts</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                    <span className="font-medium text-sm">Eagle+</span>
                                    <span className="text-purple-600 font-bold text-sm">6 pts</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg col-span-2">
                                    <span className="font-medium text-sm">Double Bogey +</span>
                                    <span className="text-gray-600 font-bold text-sm">0 pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-xs">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                            onClick={() => setCurrentView('how-it-works')}
                        >
                            Club Rules
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                            onClick={() => setCurrentView('game-rules')}
                        >
                            Club Game
                        </Button>
                    </div>
                    <Link href="/game">
                        <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                            <h1 className="text-xl font-bold">
                                Tap To Start Game!
                            </h1>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
        </div >
    );

    return (
        <>
            {currentView === 'home' && renderHomeView()}
            {currentView === 'how-it-works' && renderHowItWorksView()}
            {currentView === 'game-rules' && renderGameRulesView()}
        </>
    );
}