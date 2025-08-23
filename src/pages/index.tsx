
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StripePrice } from "@/types";
import Link from "next/link";
import Image from 'next/image';

type ViewMode = 'home' | 'how-it-works' | 'game-rules';

export default function HomePage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [currentView, setCurrentView] = useState<ViewMode>('home');
    const [price, setPrice] = useState<StripePrice | null>(null);
    const [priceLoading, setPriceLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Stripe price information for payment integration
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const { data: priceRow, error: priceError } = await supabase
                    .from("stripe_prices")
                    .select("*")
                    .eq("active", true)
                    .eq("member_cat", "aug31_paid")
                    .single();

                if (priceError || !priceRow) {
                    throw new Error("Could not find a valid price. Please contact support.");
                }
                
                setPrice(priceRow);
            } catch (e: any) {
                setError(e.message || "An unexpected error occurred.");
            } finally {
                setPriceLoading(false);
            }
        };

        fetchPrice();
    }, []);

    // Determine user access level
    const getUserAccessLevel = () => {
        if (!user) return 'guest';
        if (!profile?.member_cat || profile.member_cat !== 'aug31_paid') return 'unpaid';
        return 'paid';
    };

    const accessLevel = getUserAccessLevel();

    const handlePayment = async () => {
        if (!user || !price) return;
        // Payment integration will be handled by existing Stripe API
        // For now, this is a placeholder - actual implementation would create checkout session
        console.log("Payment integration needed here");
    };

    const handleWaitlist = () => {
        // Placeholder for waitlist functionality
        console.log("Waitlist functionality needed here");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Guest view - show game rules + sign up button
    const renderGuestView = () => (
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
                            Welcome to 4Under Club
                        </h1>
                        <p className="text-lg text-gray-700">
                            The 4Under Club guarantees fast and fun rounds of golf by solving the two problems that slow down pace of play.
                        </p>
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

                        <Link href="/auth/register">
                            <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-blue-700 inline-block">
                                <h1 className="text-xl font-bold">
                                    Sign Up to Play!
                                </h1>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );

    // Unpaid member view - show payment + waitlist options
    const renderUnpaidMemberView = () => (
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
                            Welcome Back, {profile?.display_name}!
                        </h1>
                        <p className="text-lg text-gray-700">
                            Ready to join the game? Purchase your membership or join the waitlist for upcoming events.
                        </p>
                    </div>

                    <div className="flex flex-col items-center space-y-3 mt-4 w-full max-w-xs">
                        {priceLoading ? (
                            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                        ) : error ? (
                            <p className="text-red-500 text-sm">{error}</p>
                        ) : price ? (
                            <Button
                                onClick={handlePayment}
                                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <span className="text-lg font-bold">Join {price.product_name}</span>
                            </Button>
                        ) : null}

                        <Button
                            onClick={handleWaitlist}
                            variant="outline"
                            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <span className="text-lg font-bold">Join Waitlist</span>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );

    // Paid member view - show full game rules + start game button
    const renderPaidMemberView = () => (
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
                            Club Mission
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
                                    It only takes one slow golfer to bottleneck an entire course. If we all have the same mission, there will be no bottlenecks.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                            <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                <span className="text-green-700 font-bold text-base">2</span>
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-sm font-bold">All It Takes Is One Bad Hole</h3>
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

                        <Link href="/leaderboard/monthly">
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
                                        Enforcement of pace of play is up to members, not marshals or other players. If we all have the same mission, there will be no bottlenecks.
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
                                        Playing 18 holes of golf in under 4 hours is not Speed Golf. There is plenty of time for talking on tee boxes, checking on side bets and getting another beverage.
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
                                    {accessLevel === 'guest' ? 'Welcome' : 'Club Mission'}
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

                            {accessLevel === 'paid' ? (
                                <Link href="/leaderboard/monthly">
                                    <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                        <h1 className="text-xl font-bold">
                                            Tap To Start Game!
                                        </h1>
                                    </div>
                                </Link>
                            ) : accessLevel === 'guest' ? (
                                <Link href="/auth/register">
                                    <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-blue-700 inline-block">
                                        <h1 className="text-xl font-bold">
                                            Sign Up to Play!
                                        </h1>
                                    </div>
                                </Link>
                            ) : null}
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
                        <div className="relative w-24 h-24 mx-auto">
                            <Image
                                src="/4points-m91nnzka.png"
                                alt="4Under Club Logo"
                                fill
                                className="object-contain"
                            />
                        </div> 
                        <p className="text-base text-gray-700">
                           We Golf 4 Points Not Strokes
                        </p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <h3 className="text-base font-bold mb-2">Points Are Earned Every Hole</h3>
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
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <h3 className="text-base font-bold mb-2">We Compete Against Our Targets</h3>

                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                    <span className="text-green-700 font-bold text-base">1</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">Your 4Points Target</h3>
                                    <p className="text-xs text-gray-700">
                                       Your 4Points target is calculated by either (a) average of your last 3 4Points Total Score or (b) 36 - Your GHIN Handicap.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm">
                                <div className="p-2 bg-green-100 rounded-full min-w-fit">
                                    <span className="text-green-700 font-bold text-base">2</span>
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <h3 className="text-sm font-bold">Winner Is Golfer Who Plays Their Best</h3>
                                    <p className="text-xs text-gray-700">
                                       Your Total Points scored minus your 4Points Target is your 4points Score. Highest Score Wins.
                                    </p>
                                </div>
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
                                {accessLevel === 'guest' ? 'Welcome' : 'Club Mission'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                onClick={() => setCurrentView('how-it-works')}
                            >
                                Club Rules
                            </Button>
                        </div>
                        
                        {accessLevel === 'paid' ? (
                            <Link href="/leaderboard/monthly">
                                <div className="bg-red-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-red-700 inline-block">
                                    <h1 className="text-xl font-bold">
                                        Tap To Start Game!
                                    </h1>
                                </div>
                            </Link>
                        ) : accessLevel === 'guest' ? (
                            <Link href="/auth/register">
                                <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-blue-700 inline-block">
                                    <h1 className="text-xl font-bold">
                                        Sign Up to Play!
                                    </h1>
                                </div>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {currentView === 'home' && (
                <>
                    {accessLevel === 'guest' && renderGuestView()}
                    {accessLevel === 'unpaid' && renderUnpaidMemberView()}
                    {accessLevel === 'paid' && renderPaidMemberView()}
                </>
            )}
            {currentView === 'how-it-works' && renderHowItWorksView()}
            {currentView === 'game-rules' && renderGameRulesView()}
        </>
    );
}
