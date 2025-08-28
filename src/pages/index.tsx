import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Users, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import WaitlistModal from "@/components/WaitlistModal";
import { useToast } from "@/hooks/use-toast";
import surveyService from "@/services/surveyService";
import type { StripePrice, SurveyResponse } from "@/types";

type ViewMode = 'home' | 'how-it-works' | 'game-rules';

interface SurveyQuestion {
  id: number;
  question: string;
  options: string[];
}

interface GamePool {
  id: string;
  name: string;
  entry_fee_points: number;
  prize_pool_percentage: number;
  status: string;
  start_date: string;
  end_date: string;
  min_players: number;
  max_players: number;
  current_players: number;
  total_prize_pool: number;
  created_at: string;
  created_by: string | null;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    question: "How often do you play?",
    options: ["New to Golf", "1 to 11 Rounds/Year", "12 to 24 Rounds/Year", "25+ Rounds/Year"]
  },
  {
    id: 2,
    question: "Typical 18 hole round duration?",
    options: ["Under 4 Hours", "4-4½ Hours", "4½-5 Hours", "5+ Hours"]
  },
  {
    id: 3,
    question: "Do you have a GHIN #?",
    options: ["Yes", "No"]
  }
];

export default function HomePage() {
    const router = useRouter();
    const { user, profile, loading, register } = useAuth();
    const [currentView, setCurrentView] = useState<ViewMode>('home');
    const [price, setPrice] = useState<StripePrice | null>(null);
    const [priceLoading, setPriceLoading] = useState(true);
    const [gamePool, setGamePool] = useState<GamePool | null>(null);
    const [gamePoolLoading, setGamePoolLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
    
    // Survey state
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [sessionId] = useState(() => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random}`;
    });
    const [isInitializing, setIsInitializing] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);

    // Registration form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [registrationLoading, setRegistrationLoading] = useState(false);
    const { toast } = useToast();

    // Initialize survey for guests
    useEffect(() => {
        if (!user && !responseId && !isInitializing && currentStep > 0) {
            const initSurvey = async () => {
                setIsInitializing(true);
                try {
                    const id = await surveyService.startSurvey(sessionId);
                    if (id) {
                        setResponseId(id);
                    }
                } catch (error) {
                    console.error('Failed to initialize survey:', error);
                } finally {
                    setIsInitializing(false);
                }
            };
            initSurvey();
        }
    }, [user, responseId, isInitializing, currentStep, sessionId]);

    // PHASE 3: Fetch both Stripe price and GamePool data
    useEffect(() => {
        const fetchGameData = async () => {
            try {
                // Fetch Stripe price information
                const priceResponse = await fetch('/api/stripe-prices');
                if (!priceResponse.ok) {
                    throw new Error('Failed to fetch price data');
                }
                
                const { data: priceRows } = await priceResponse.json();
                
                // Find the aug31_paid price
                const priceRow = priceRows?.find((p: StripePrice) => 
                    p.active && p.member_cat === 'aug31_paid'
                );
                
                if (!priceRow) {
                    throw new Error("Could not find a valid price. Please contact support.");
                }
                
                setPrice(priceRow);

                // PHASE 3: Fetch active game pools for inventory checking
                const gamePoolResponse = await fetch('/api/gamepools');
                if (!gamePoolResponse.ok) {
                    throw new Error('Failed to fetch game pool data');
                }
                
                const { data: gamePools } = await gamePoolResponse.json();
                
                // Find the active August 31 game pool
                const activePool = gamePools?.find((pool: GamePool) => 
                    pool.status === 'ACTIVE' && pool.name.includes('August 31')
                );
                
                if (!activePool) {
                    throw new Error("No active game pools available.");
                }
                
                setGamePool(activePool);
                
            } catch (e: any) {
                console.error('Game data fetch error:', e);
                setError(e.message || "An unexpected error occurred.");
            } finally {
                setPriceLoading(false);
                setGamePoolLoading(false);
            }
        };

        fetchGameData();
    }, []);

    // Handle survey answers
    const handleAnswer = async (answer: string) => {
        if (typeof window.navigator.vibrate === "function") {
            window.navigator.vibrate(10);
        }

        const newAnswers = [...answers];
        newAnswers[currentStep - 1] = answer;
        setAnswers(newAnswers);

        if (responseId) {
            const updates: Partial<SurveyResponse> = {
                drop_off_step: currentStep + 1
            };
            switch(currentStep) {
                case 1: updates.question_1_answer = answer; break;
                case 2: updates.question_2_answer = answer; break;
                case 3: updates.question_3_answer = answer; break;
            }
            await surveyService.updateSurveyResponse(responseId, updates);
        }

        if (currentStep < surveyQuestions.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // After 3rd question, show registration
            setShowRegistration(true);
            if (responseId) {
                await surveyService.completeSurvey(responseId);
            }
        }
    };

    // Handle inline registration after survey completion
    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !password || !displayName) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all fields"
            });
            return;
        }

        if (password.length < 6) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Password must be at least 6 characters"
            });
            return;
        }

        setRegistrationLoading(true);
        
        try {
            await register(email, password, displayName);
            toast({
                title: "Success!",
                description: "Account created successfully! Welcome to the 4Under Club."
            });
            
            // After successful registration, user will be redirected to unpaid member view
            // The useAuth context will handle the state change automatically
            
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "Failed to create account. Please try again."
            });
        } finally {
            setRegistrationLoading(false);
        }
    };

    // Determine user access level
    const getUserAccessLevel = () => {
        if (!user) return 'guest';
        if (!profile?.member_cat || profile.member_cat !== 'aug31_paid') return 'unpaid';
        return 'paid';
    };

    const accessLevel = getUserAccessLevel();

    const [paymentLoading, setPaymentLoading] = useState(false);

    // PHASE 3: Updated payment handler with gamepool_id and inventory checking
    const handlePayment = async () => {
        if (!user || !price || !gamePool) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please ensure you're logged in and try again."
            });
            return;
        }

        // PHASE 3: Check if game is sold out before proceeding
        const availableSlots = gamePool.max_players - gamePool.current_players;
        if (availableSlots <= 0) {
            toast({
                variant: "destructive",
                title: "Game Sold Out",
                description: "Sorry, this game is currently sold out. Join the waitlist to be notified of future games!"
            });
            return;
        }

        setPaymentLoading(true);
        
        try {
            // PHASE 3: Call the checkout session API with gamepool_id
            const response = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: price.price_id,
                    userId: user.id,
                    gamepool_id: gamePool.id,  // PHASE 3: Include gamepool_id
                    quantity: 1                 // PHASE 3: Default to 1 slot
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const { url } = await response.json();
            
            if (!url) {
                throw new Error('No checkout URL received');
            }

            // Redirect to Stripe Checkout
            window.location.href = url;
            
        } catch (error) {
            console.error('Payment error:', error);
            toast({
                variant: "destructive",
                title: "Payment Error",
                description: error instanceof Error ? error.message : "Unable to process payment. Please try again."
            });
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleWaitlist = () => {
        if (user) {
            setIsWaitlistModalOpen(true);
        } else {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to join the waitlist.",
            });
        }
    };

    // PHASE 3: Calculate inventory status
    const getInventoryStatus = () => {
        if (!gamePool) return { available: 0, isSoldOut: true, statusText: "Loading..." };
        
        const available = gamePool.max_players - gamePool.current_players;
        const isSoldOut = available <= 0;
        
        let statusText = "";
        if (isSoldOut) {
            statusText = "SOLD OUT";
        } else if (available === 1) {
            statusText = "1 spot left!";
        } else {
            statusText = `${available} spots left`;
        }
        
        return { available, isSoldOut, statusText };
    };

    const inventoryStatus = getInventoryStatus();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Guest survey view - replaces old welcome view
    const renderGuestView = () => {
        // Show registration after completing survey
        if (showRegistration) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
                    <Card className="w-full max-w-md mx-auto min-h-[600px]">
                        <CardContent className="p-8 text-center space-y-6 flex flex-col justify-between min-h-[552px]">
                            <div className="space-y-6">
                                <div className="relative w-24 h-24 mx-auto">
                                    <Image
                                        src="/full-4unders-logo-mddg489f.png"
                                        alt="4Under Club Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-2xl font-bold text-green-700">
                                        Join Now and Play 4Points!
                                    </h1>
                                    <p className="text-gray-600">
                                        Create your account to start competing and view leaderboards.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Inline Registration Form */}
                            <div className="space-y-4">
                                <form onSubmit={handleRegistration} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName" className="text-left block">Golfer Name</Label>
                                        <Input
                                            id="displayName"
                                            type="text"
                                            placeholder="Enter your golfer name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-left block">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-left block">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                        disabled={registrationLoading}
                                    >
                                        {registrationLoading ? "Creating Account..." : "Create Account"}
                                    </Button>
                                </form>
                                
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{" "}
                                        <button 
                                            onClick={() => router.push('/auth/login')}
                                            className="text-green-600 hover:underline font-medium"
                                        >
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Initial survey landing
        if (currentStep === 0) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
                    <Card className="w-full max-w-md mx-auto min-h-[600px]">
                        <CardContent className="p-8 text-center space-y-6 flex flex-col justify-between min-h-[552px]">
                            <div className="space-y-6">
                                <div className="relative w-24 h-24 mx-auto">
                                    <Image
                                        src="/full-4unders-logo-mddg489f.png"
                                        alt="4Under Club Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-2xl font-bold text-green-700">
                                        Tired of 5+ hour golf rounds at Rancho?
                                    </h1>
                                    <p className="text-lg text-gray-700">
                                        The 4Under Club is open to anyone who wants to play 18 holes in under 4 hours.
                                    </p>
                                    <p>(Under 2 hours for 9 holes!)</p>
                                    <p className="text-lg font-medium text-green-600">
                                        What's our secret? Join us to find out.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => setCurrentStep(1)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                                >
                                    Let's Get Started
                                </Button>
                                <Button
                                    onClick={() => router.push('/auth/login')}
                                    variant="outline"
                                    className="w-full text-lg py-3"
                                >
                                    Member Login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Survey questions
        const currentQuestion = surveyQuestions[currentStep - 1];
        const progressPercentage = (currentStep / surveyQuestions.length) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
                <Card className="w-full max-w-md mx-auto min-h-[600px]">
                    <CardContent className="p-6 space-y-6 flex flex-col justify-between min-h-[552px]">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Progress value={progressPercentage} className="w-full h-2" />
                                <p className="text-sm text-gray-500 text-center">
                                    Question {currentStep} of {surveyQuestions.length}
                                </p>
                            </div>

                            <div className="relative w-24 h-24 mx-auto">
                                <Image
                                    src="/full-4unders-logo-mddg489f.png"
                                    alt="4Under Club Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            <div className="text-center space-y-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {currentQuestion.question}
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {currentQuestion.options.map((option, index) => {
                                const isFrequencyQuestion = currentQuestion.id === 1;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(option)}
                                        className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 hover:shadow-lg border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 p-4 text-center"
                                    >
                                        {isFrequencyQuestion ? (
                                            <>
                                                <span className="text-2xl font-bold text-green-600">
                                                    {option === "New to Golf" ? "New" : 
                                                     option === "1 to 11 Rounds/Year" ? "1-11" :
                                                     option === "12 to 24 Rounds/Year" ? "12-24" :
                                                     option === "25+ Rounds/Year" ? "25+" : option}
                                                </span>
                                                <span className="text-xs text-gray-600 mt-1">
                                                    {option === "New to Golf" ? "to Golf" : "Rounds/Year"}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-lg font-semibold text-gray-800">
                                                {option}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // PHASE 3: Updated unpaid member view with inventory status integrated as Join button
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
                        <div className="flex justify-center w-full">
                            {priceLoading || gamePoolLoading ? (
                                <div className="bg-gray-100 rounded-xl p-6 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            ) : price && gamePool ? (
                                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
                                    {/* Game Pool Info */}
                                    <div className="text-center">
                                        <h3 className="font-bold text-green-800 text-lg">{gamePool.name}</h3>
                                        <p className="text-sm text-green-700 font-medium">
                                            {inventoryStatus.statusText}
                                        </p>
                                    </div>

                                    {/* Join Game Button integrated into the stats module */}
                                    <Button
                                        onClick={handlePayment}
                                        disabled={paymentLoading || inventoryStatus.isSoldOut}
                                        className={`w-full py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all ${inventoryStatus.isSoldOut
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                            }`}
                                    >
                                        {inventoryStatus.isSoldOut ? "SOLD OUT" :
                                            paymentLoading ? "Processing..." :
                                                `Buy 6:10am Tee Time`}
                                    </Button>
                                </div>
                            ) : null}
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
                    </div>

                    {/* Club Rules Button */}
                    <div className="w-full max-w-xs">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full text-white bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                            onClick={() => setCurrentView('how-it-works')}
                        >
                            Club Rules
                        </Button>
                    </div>

                    {/* Gamepool Stats Module integrated as Join button */}
                  

                    {/* Join Waitlist Button */}
                    <div className="w-full max-w-xs">
                        <Button
                            onClick={handleWaitlist}
                            variant="outline"
                            size="lg"
                            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Join Waitlist
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
                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm">
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

                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm">
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

                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm">
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

                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm">
                                <div className="p-1 bg-purple-100 rounded-full min-w-fit">
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
                                {/* Only show Club Game button for PAID users */}
                                {accessLevel === 'paid' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-sm text-white bg-green-600 hover:bg-green-700"
                                        onClick={() => setCurrentView('game-rules')}
                                    >
                                        Club Game
                                    </Button>
                                )}
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
                                    <div className="bg-blue-600 text-white rounded-2xl px-4 py-1 shadow-lg hover:shadow-xl transition-shadow cursor-pointer hover:bg-blue-700 inline-block">
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
                        
                        {/* Only paid members should see start game button */}
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

    const handleStartGame = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please ensure you're logged in and try again."
            });
            return;
        }

        if (!price || !gamePool) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please ensure you're logged in and try again."
            });
            return;
        }

        // PHASE 3: Check if game is sold out before proceeding
        const availableSlots = gamePool.max_players - gamePool.current_players;
        if (availableSlots <= 0) {
            toast({
                variant: "destructive",
                title: "Game Sold Out",
                description: "Sorry, this game is currently sold out. Join the waitlist to be notified of future games!"
            });
            return;
        }

        setPaymentLoading(true);
        
        try {
            // PHASE 3: Call the checkout session API with gamepool_id
            const response = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: price.price_id,
                    userId: user.id,
                    gamepool_id: gamePool.id,  // PHASE 3: Include gamepool_id
                    quantity: 1                 // PHASE 3: Default to 1 slot
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const { url } = await response.json();
            
            if (!url) {
                throw new Error('No checkout URL received');
            }

            // Redirect to Stripe Checkout
            window.location.href = url;
            
        } catch (error) {
            console.error('Payment error:', error);
            toast({
                variant: "destructive",
                title: "Payment Error",
                description: error instanceof Error ? error.message : "Unable to process payment. Please try again."
            });
        } finally {
            setPaymentLoading(false);
        }
    };

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

            {user && (
                <WaitlistModal
                    isOpen={isWaitlistModalOpen}
                    onClose={() => setIsWaitlistModalOpen(false)}
                    userId={user.id}
                    onSuccess={(entry) => {
                        console.log("Successfully managed waitlist:", entry);
                        toast({
                            title: "Success",
                            description: "Your waitlist preferences have been saved."
                        });
                    }}
                />
            )}
        </>
    );
}
