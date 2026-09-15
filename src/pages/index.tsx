import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Target, Zap, ArrowRight, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface SurveyAnswers {
  round_duration?: string;
  last_score?: string;
  price_premium?: string;
  email?: string;
  username?: string;
  referred_by?: string;
}

export default function FourUndersClub() {
  const router = useRouter();
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState < SurveyAnswers > ({});
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [priceId, setPriceId] = useState < string > ("");
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch active 4unders price from database
  useEffect(() => {
    fetchActivePriceId();
  }, []);

  // Capture referral code from URL
  useEffect(() => {
    if (router.query.ref && typeof router.query.ref === 'string') {
      setSurveyAnswers(prev => ({ ...prev, referred_by: router.query.ref as string }));
    }
  }, [router.query.ref]);

  const fetchActivePriceId = async () => {
    try {
      const response = await fetch("/api/stripe-prices/4unders");
      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }
      const data = await response.json();
      setPriceId(data.price_id);
    } catch (error) {
      console.error("Error fetching price:", error);
      toast({
        title: "Configuration error",
        description: "Unable to load pricing. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setPriceLoading(false);
    }
  };

  const handleAnswer = (key: string, value: string) => {
    setSurveyAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handlePayment = async () => {
    // Validate email and username
    if (!surveyAnswers.email || !surveyAnswers.username) {
      toast({
        title: "Missing information",
        description: "Please enter both email and username to continue.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(surveyAnswers.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic username validation (alphanumeric, underscore, dash, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(surveyAnswers.username)) {
      toast({
        title: "Invalid username",
        description: "Username must be 3-20 characters (letters, numbers, underscore, dash only).",
        variant: "destructive",
      });
      return;
    }

    // Validate price is loaded
    if (!priceId) {
      toast({
        title: "Configuration error",
        description: "Pricing not loaded. Please refresh the page or contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: priceId,
          userId: "guest_" + Date.now(),
          gamepool_id: "four_unders_club",
          metadata: {
            product: "four_unders_membership",
            email: surveyAnswers.email,
            username: surveyAnswers.username,
            round_duration: surveyAnswers.round_duration || "",
            last_score: surveyAnswers.last_score || "",
            price_premium: surveyAnswers.price_premium || "",
            referred_by: surveyAnswers.referred_by || ""
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Payment failed");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const handleWaitlistOnly = async () => {
    // Validate email and username
    if (!surveyAnswers.email || !surveyAnswers.username) {
      toast({
        title: "Missing information",
        description: "Please enter both email and username to continue.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(surveyAnswers.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic username validation (alphanumeric, underscore, dash, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(surveyAnswers.username)) {
      toast({
        title: "Invalid username",
        description: "Username must be 3-20 characters (letters, numbers, underscore, dash only).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/4unders-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyAnswers)
      });

      if (!response.ok) throw new Error("Submission failed");

      toast({
        title: "Welcome to the club! 🏌️",
        description: "We'll be in touch soon with next steps.",
      });
      setCurrentStep(surveySteps.length);
      setShowPayment(false);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/4unders-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyAnswers)
      });

      if (!response.ok) throw new Error("Submission failed");

      toast({
        title: "Welcome to the club! 🏌️",
        description: "We'll be in touch soon with next steps.",
      });
      setCurrentStep(surveySteps.length);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const surveySteps = [
    {
      question: "How long are your Rancho Rounds?",
      key: "round_duration",
      options: [
        { value: "under_4", label: "Under 4 Hours", icon: Zap },
        { value: "4_to_4.5", label: "4 to 4 1/2 Hours", icon: Clock },
        { value: "4.5_to_5", label: "4 1/2 to 5 Hours", icon: Clock },
        { value: "over_5", label: "Over 5 Hours", icon: Clock }
      ]
    },
    {
      question: "What's the last score you shot at Rancho?",
      key: "last_score",
      options: [
        { value: "under_80", label: "Under 80", icon: Target },
        { value: "80_89", label: "80-89", icon: Target },
        { value: "90_99", label: "90-99", icon: Target },
        { value: "over_100", label: "100+", icon: Target }
      ]
    },
    {
      question: "Would you pay 2x the Rancho Greens fee to guarantee a 4 hour round?",
      key: "price_premium",
      options: [
        { value: "absolutely", label: "Absolutely!", icon: CheckCircle2 },
        { value: "probably", label: "Probably Yes", icon: CheckCircle2 },
        { value: "maybe", label: "Maybe", icon: CheckCircle2 },
        { value: "no", label: "No Way", icon: CheckCircle2 }
      ]
    },
    {
      question: "Join the Four Under Club",
      key: "email",
      type: "email"
    }
  ];

  const currentStepData = surveySteps[currentStep];
  const canProceed = surveyAnswers[currentStepData?.key as keyof SurveyAnswers];

  // Determine if user needs to pay (answered anything other than "no" to question 3)
  const needsPayment = surveyAnswers.price_premium && surveyAnswers.price_premium !== "no";

  const handleNext = () => {
    // If we just finished question 3 (index 2)
    if (currentStep === 2) {
      if (needsPayment) {
        // Show payment step
        setShowPayment(true);
      } else {
        // Skip to email step
        setCurrentStep(3);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <>
      <Head>
        <title>The Four Under Club - Rancho Park</title>
        <meta name="description" content="Play Rancho Park in Under 4 Hours - Join the Four Under Club" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="pt-6 pb-12 px-4">
          <div className="max-w-5xl mx-auto">

            {/* Logo + Tagline Row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-10">

              {/* Logo */}
              <div className="flex-shrink-0">
                <Image
                  src="/4Under_logo_vertical.jpg"
                  alt="Four Under Club"
                  width={120}
                  height={185}
                  priority
                  className="
            w-[100px]
            md:w-[120px]
            h-auto
            object-contain
          "
                />
              </div>

              {/* Tagline */}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
                  Our Mission

                </h1>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <p>Play Rancho Park in under 4 hours.</p>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <p>Uphold Four Under pace-of-play standards without exception.</p>
                </div>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <p>Promote Fast, Fun and Fair golf.</p>
                </div>

              </div>

            </div>


            {/* CTA */}
            {!showSurvey && currentStep < surveySteps.length && !showPayment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >

                <Button
                  size="lg"
                  onClick={() => setShowSurvey(true)}
                  className="
            !bg-emerald-600
            hover:!bg-emerald-700
            !text-white
            !font-semibold
            !rounded-xl
            !h-14
            !px-10
            !text-lg
          "
                >
                  Reserve Your Spot
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-sm text-gray-500 mt-4">
                  Takes less than 30 seconds
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Founded by{" "}
                  <Link href="/mvg" className="text-emerald-600 hover:text-emerald-700 underline">
                    Minimum Viable Golf
                  </Link>
                </p>

              </motion.div>
            )}

            {/* Payment Step */}
            <AnimatePresence>
              {showPayment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12"
                >
                  <Card className="border-2 border-emerald-300 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-emerald-600">
                          MEMBERSHIP OPTIONS
                        </span>
                      </div>
                      <CardTitle className="text-xl md:text-2xl">
                        Join the Four Under Club
                      </CardTitle>
                      <p className="text-gray-600 mt-2">
                        Choose how you'd like to join
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Email and Username Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            value={surveyAnswers.email || ""}
                            onChange={(e) => handleAnswer("email", e.target.value)}
                            className="text-base"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            We'll send tournament details and updates here
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Golfer Username *
                          </label>
                          <Input
                            type="text"
                            placeholder="golf_username"
                            value={surveyAnswers.username || ""}
                            onChange={(e) => handleAnswer("username", e.target.value.toLowerCase())}
                            className="text-base"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            3-20 characters, letters/numbers only (can be changed later)
                          </p>
                        </div>
                      </div>

                      {/* Paid Option */}
                      <div className="bg-emerald-50 rounded-lg p-6 border-2 border-emerald-300">
                        <div className="flex items-start gap-4 mb-4">
                          <CreditCard className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg">
                                Reserve Your Tournament Spot
                              </h3>
                              <span className="text-2xl font-bold text-emerald-900">$50</span>
                            </div>
                            <p className="text-gray-700 mb-3">
                              Secure your spot in the first Four Under Club tournament
                              at Rancho Park. Limited to the first 48 members.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>Guaranteed 4-hour or faster round</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>First tournament entry included</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>Exclusive member benefits and priority access</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <Button
                          onClick={handlePayment}
                          disabled={isProcessingPayment || priceLoading || !priceId || !surveyAnswers.email || !surveyAnswers.username}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                        >
                          {isProcessingPayment ? "Processing..." : priceLoading ? "Loading..." : "Pay $50 & Reserve Spot"}
                          {!isProcessingPayment && !priceLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                        </Button>
                      </div>

                      {/* Free Waitlist Option */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white px-4 text-gray-500">or</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                        <div className="mb-4">
                          <h3 className="font-bold text-lg mb-2">
                            Join Waitlist Only
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Stay informed about Four Under Club updates, events, and future opportunities.
                            No payment required.
                          </p>
                        </div>

                        <Button
                          onClick={handleWaitlistOnly}
                          disabled={isSubmitting || isProcessingPayment || !surveyAnswers.email || !surveyAnswers.username}
                          variant="outline"
                          className="w-full h-12 border-2"
                        >
                          {isSubmitting ? "Joining..." : "Join Waitlist Only (Free)"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Survey Section */}
            <AnimatePresence>
              {showSurvey && currentStep < surveySteps.length && !showPayment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12"
                >
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-2 border-gray-200 shadow-xl">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-gray-500">
                            {currentStepData.type === "email" ? "Final Step" : `Question ${currentStep + 1} of 3`}
                          </span>
                          <div className="flex gap-1">
                            {surveySteps.slice(0, 3).map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-2 w-8 rounded-full transition-colors ${idx <= currentStep ? "bg-emerald-600" : "bg-gray-200"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                        <CardTitle className="text-xl md:text-2xl">{currentStepData.question}</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {currentStepData.type !== "email" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentStepData.options?.map((option) => {
                              const Icon = option.icon;
                              const isSelected = surveyAnswers[currentStepData.key as keyof SurveyAnswers] === option.value;

                              return (
                                <motion.div
                                  key={option.value}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card
                                    className={`cursor-pointer transition-all border-2 ${isSelected
                                        ? "border-emerald-600 bg-emerald-50 shadow-md"
                                        : "border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                                      }`}
                                    onClick={() => handleAnswer(currentStepData.key, option.value)}
                                  >
                                    <CardContent className="p-4 md:p-6 text-center">
                                      <Icon className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 ${isSelected ? "text-emerald-600" : "text-gray-400"
                                        }`} />
                                      <p className={`font-semibold text-base md:text-lg ${isSelected ? "text-emerald-900" : "text-gray-700"
                                        }`}>
                                        {option.label}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-gray-600 text-center">
                              Enter your email to join the Four Under Club waitlist
                            </p>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              value={surveyAnswers.email || ""}
                              onChange={(e) => handleAnswer("email", e.target.value)}
                              className="text-base md:text-lg p-4 md:p-6 text-center"
                            />
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          {currentStep > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => setCurrentStep(prev => prev - 1)}
                              className="flex-1"
                            >
                              Back
                            </Button>
                          )}

                          <Button
                            onClick={() => {
                              if (currentStepData.type === "email") {
                                handleSubmit();
                              } else {
                                handleNext();
                              }
                            }}
                            disabled={!canProceed || isSubmitting}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {isSubmitting ? "Joining..." : currentStepData.type === "email" ? "Join the Club" : "Next"}
                            {currentStepData.type !== "email" && <ArrowRight className="ml-2 w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
            {currentStep >= surveySteps.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-10"
              >
                <Card className="overflow-hidden border-2 border-emerald-300 shadow-xl">

                  <CardContent className="p-0">

                    <div className="bg-gradient-to-b from-emerald-50 to-white py-8">

                      <Image
                        src="/4Under_logo_vertical.jpg"
                        alt="Four Under Club"
                        width={100}
                        height={155}
                        priority
                        className="
              mx-auto
              w-[80px]
              md:w-[100px]
              h-auto
            "
                      />

                    </div>

                    <div className="px-6 py-8 text-center border-t border-emerald-100">

                      <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 mb-6">
                        <span className="text-sm font-bold text-emerald-700">
                          WAITLIST CONFIRMED
                        </span>
                      </div>

                      <h2 className="text-3xl font-bold mb-4">
                        Welcome to the Club
                      </h2>

                      <p className="text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
                        You're officially on the Four Under Club waitlist.
                        We'll be in touch with membership details,
                        events, tee times and opportunities to help
                        improve the Rancho Park golf experience.
                      </p>

                      <Link href="/golfmusic" className="block">
                        <Button
                          size="lg"
                          className="
                !w-full
                !h-14
                !rounded-xl
                !bg-emerald-600
                hover:!bg-emerald-700
                !text-white
                !font-semibold
              "
                        >
                          LET'S TALK
                        </Button>
                      </Link>

                      <p className="mt-4 text-sm text-gray-500">
                        Got a golf story?

                        Got a music story?

                        Got both?

                        Let's spend 15 minutes talking about it.


                      </p>

                    </div>

                  </CardContent>

                </Card>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}