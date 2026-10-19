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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({});
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [priceId, setPriceId] = useState<string>("");
  const [priceLoading, setPriceLoading] = useState(true);
  const [showEmailStep, setShowEmailStep] = useState(false);

  useEffect(() => {
    fetchActivePriceId();
  }, []);

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
    if (!surveyAnswers.email || !surveyAnswers.username) {
      toast({
        title: "Missing information",
        description: "Please enter both email and username to continue.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(surveyAnswers.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(surveyAnswers.username)) {
      toast({
        title: "Invalid username",
        description: "Username must be 3-20 characters (letters, numbers, underscore, dash only).",
        variant: "destructive",
      });
      return;
    }

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
    if (!surveyAnswers.email || !surveyAnswers.username) {
      toast({
        title: "Missing information",
        description: "Please enter both email and username to continue.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(surveyAnswers.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

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
      setShowEmailStep(false);
      setShowPayment(false);
      setShowSurvey(false);
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

  const surveyQuestions = [
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
    }
  ];

  const allQuestionsAnswered = surveyQuestions.every(q => surveyAnswers[q.key as keyof SurveyAnswers]);
  const needsPayment = surveyAnswers.price_premium && surveyAnswers.price_premium !== "no";

  const handleSurveyNext = () => {
    if (needsPayment) {
      setShowPayment(true);
    } else {
      setShowEmailStep(true);
    }
    setShowSurvey(false);
  };

  return (
    <>
      <Head>
        <title>The Four Under Club - Rancho Park</title>
        <meta name="description" content="Play Rancho Park in Under 4 Hours - Join the Four Under Club" />
      </Head>

      <div className="min-h-screen bg-white">
        <section className="pt-6 pb-12 px-4">
          <div className="max-w-5xl mx-auto">

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-10">
              <div className="flex-shrink-0">
                <Image
                  src="/4Under_logo_vertical.jpg"
                  alt="Four Under Club"
                  width={120}
                  height={185}
                  priority
                  className="w-[100px] md:w-[120px] h-auto object-contain"
                />
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
                  Our Mission
                </h1>

                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <p>Play Rancho Park in under 4 hours.</p>
                </div>

               
              </div>
            </div>

            {!showSurvey && !showPayment && !showEmailStep && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Button
                  size="lg"
                  onClick={() => setShowSurvey(true)}
                  className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !font-semibold !rounded-xl !h-14 !px-10 !text-lg"
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

            {/* All 3 Survey Questions on One Screen */}
            <AnimatePresence>
              {showSurvey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12"
                >
                  <Card className="border-2 border-gray-200 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-gray-500">
                          Answer All 3 Questions
                        </span>
                        <div className="flex gap-1">
                          {surveyQuestions.map((q, idx) => (
                            <div
                              key={idx}
                              className={`h-2 w-8 rounded-full transition-colors ${
                                surveyAnswers[q.key as keyof SurveyAnswers] ? "bg-emerald-600" : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <CardTitle className="text-xl md:text-2xl">Quick Survey</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-8">
                      {surveyQuestions.map((questionData, qIndex) => (
                        <div key={questionData.key} className="space-y-4">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {qIndex + 1}. {questionData.question}
                          </h3>
                          <div className="grid grid-cols-4 gap-2">
                            {questionData.options.map((option) => {
                              const Icon = option.icon;
                              const isSelected = surveyAnswers[questionData.key as keyof SurveyAnswers] === option.value;

                              return (
                                <motion.div
                                  key={option.value}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card
                                    className={`cursor-pointer transition-all border-2 ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-50 shadow-md"
                                        : "border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                                    }`}
                                    onClick={() => handleAnswer(questionData.key, option.value)}
                                  >
                                    <CardContent className="p-2 md:p-4 text-center">
                                      <Icon className={`w-6 h-6 md:w-10 md:h-10 mx-auto mb-1 md:mb-2 ${
                                        isSelected ? "text-emerald-600" : "text-gray-400"
                                      }`} />
                                      <p className={`font-semibold text-xs md:text-base leading-tight ${
                                        isSelected ? "text-emerald-900" : "text-gray-700"
                                      }`}>
                                        {option.label}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {allQuestionsAnswered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-4"
                        >
                          <Button
                            onClick={handleSurveyNext}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                          >
                            Next
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Step - Side by Side Options */}
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

                      {/* Side by Side Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Paid Option */}
                        <div className="bg-emerald-50 rounded-lg p-6 border-2 border-emerald-300">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <CreditCard className="w-6 h-6 text-emerald-600" />
                              <span className="text-2xl font-bold text-emerald-900">$50</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">
                              Reserve Your Spot
                            </h3>
                            <p className="text-sm text-gray-700 mb-3">
                              Secure your spot in the first Four Under Club tournament at Rancho Park. Limited to 48 members.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700 mb-4">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>Guaranteed 4-hour round</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>First tournament entry</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>Exclusive member benefits</span>
                              </li>
                            </ul>
                          </div>

                          <Button
                            onClick={handlePayment}
                            disabled={isProcessingPayment || priceLoading || !priceId || !surveyAnswers.email || !surveyAnswers.username}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                          >
                            {isProcessingPayment ? "Processing..." : priceLoading ? "Loading..." : "Pay $50"}
                            {!isProcessingPayment && !priceLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                          </Button>
                        </div>

                        {/* Free Waitlist Option */}
                        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <CheckCircle2 className="w-6 h-6 text-gray-600" />
                              <span className="text-2xl font-bold text-gray-900">Free</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">
                              Waitlist Only
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Stay informed about Four Under Club updates, events, and future opportunities. No payment required.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 mb-4">
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span>Club updates & news</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span>Event notifications</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span>Future opportunities</span>
                              </li>
                            </ul>
                          </div>

                          <Button
                            onClick={handleWaitlistOnly}
                            disabled={isSubmitting || isProcessingPayment || !surveyAnswers.email || !surveyAnswers.username}
                            variant="outline"
                            className="w-full h-11 border-2"
                          >
                            {isSubmitting ? "Joining..." : "Join Waitlist"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Only Step (for non-payment path) */}
            <AnimatePresence>
              {showEmailStep && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12"
                >
                  <Card className="border-2 border-gray-200 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl md:text-2xl">Join the Waitlist</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
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
                          3-20 characters, letters/numbers only
                        </p>
                      </div>

                      <Button
                        onClick={handleWaitlistOnly}
                        disabled={isSubmitting || !surveyAnswers.email || !surveyAnswers.username}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                      >
                        {isSubmitting ? "Joining..." : "Join the Club"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
            {!showSurvey && !showPayment && !showEmailStep && surveyAnswers.email && (
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
                        className="mx-auto w-[80px] md:w-[100px] h-auto"
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
                          className="!w-full !h-14 !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-semibold"
                        >
                          LET'S TALK
                        </Button>
                      </Link>

                      <p className="mt-4 text-sm text-gray-500">
                        Got a golf story? Got a music story? Got both? Let's spend 15 minutes talking about it.
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