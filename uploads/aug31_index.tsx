import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from 'next/image';

type ViewMode = 'home' | 'how-it-works';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentView, setCurrentView] = useState < ViewMode > ('home');

   

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
                          
                        </div>

                        <Link href="https://buy.stripe.com/fZu7sMaJOb3J5qF8kQa3u0f">
                            <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                <h1 className="text-xl font-bold">
                                   Join August 31 6:10AM Game
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
                                Members play 18 holes of golf in under 4 hours and under 2 hours for 9 holes.
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
                                        Members play a points based, not stroke based, scoring method that is fast and fun. And we own the game.
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
                                    onClick={() => setCurrentView('home')}
                                >
                                    Club Mission
                                </Button>
                            </div>

                            <Link href="https://buy.stripe.com/fZu7sMaJOb3J5qF8kQa3u0f">
                                <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                    <h1 className="text-xl font-bold">
                                        Join August 31 6:10AM Game
                                    </h1>
                                </div>
                            </Link>

                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    

    return (
        <>
            {currentView === 'home' && renderHomeView()}
            {currentView === 'how-it-works' && renderHowItWorksView()}
            {currentView === 'game-rules' && renderGameRulesView()}
        </>
    );
}