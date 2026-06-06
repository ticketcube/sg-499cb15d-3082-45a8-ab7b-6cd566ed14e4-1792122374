import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Target, TrendingUp, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface SurveyAnswers {
  round_duration?: string;
  last_score?: string;
  price_premium?: string;
  email?: string;
}

export default function FourUndersClub() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({});

  const handleAnswer = (key: string, value: string) => {
    setSurveyAnswers(prev => ({ ...prev, [key]: value }));
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
        { value: "under_3", label: "Under 3 Hours", icon: Zap },
        { value: "3_to_4", label: "3-4 Hours", icon: Clock },
        { value: "4_to_5", label: "4-5 Hours", icon: Clock },
        { value: "over_5", label: "Over 5 Hours", icon: TrendingUp }
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

  return (
    <>
      <Head>
        <title>The Four Under Club - Rancho Park</title>
        <meta name="description" content="Play Rancho Park in Under 4 Hours - Join the Four Under Club" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1),transparent_50%)]" />
          
          <div className="max-w-4xl mx-auto relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex justify-center mb-6">
                <Image 
                  src="/full-4unders-logo-mddg489f.png" 
                  alt="Four Under Club Logo" 
                  width={180} 
                  height={72}
                  className="h-16 w-auto"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                The Four Under Club
              </h1>
              
              <div className="max-w-2xl mx-auto space-y-6 mb-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-wide">
                    C L U B &nbsp; M I S S I O N
                  </h2>
                  <div className="space-y-3 text-lg text-gray-700">
                    <p className="font-semibold">Play Rancho Park in Under 4 Hours.</p>
                    <p>Uphold 4Unders pace of play rules at all times with no exceptions.</p>
                    <p className="font-semibold text-emerald-700">Inculcate Fast, Fun and Fair golf.</p>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                <Clock className="w-5 h-5" />
                <span>Answer 3 Questions to Join</span>
              </div>
            </motion.div>

            {/* MVG Connection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-emerald-600" />
                    Built on Minimum Viable Golf Principles
                  </CardTitle>
                  <CardDescription className="text-base">
                    The Four Under Club embodies MVG's philosophy of Fast, Fun, and Fair golf. 
                    We use <span className="font-semibold text-emerald-700">4Points</span> as our 
                    scoring format—a faster, more competitive way to play that keeps rounds 
                    under 4 hours while maximizing enjoyment.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Survey Section */}
            {currentStep < surveySteps.length ? (
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
                        {surveySteps.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 w-8 rounded-full transition-colors ${
                              idx <= currentStep ? "bg-emerald-600" : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">{currentStepData.question}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {currentStepData.type !== "email" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className={`cursor-pointer transition-all border-2 ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-50 shadow-md"
                                    : "border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                                }`}
                                onClick={() => handleAnswer(currentStepData.key, option.value)}
                              >
                                <CardContent className="p-6 text-center">
                                  <Icon className={`w-12 h-12 mx-auto mb-3 ${
                                    isSelected ? "text-emerald-600" : "text-gray-400"
                                  }`} />
                                  <p className={`font-semibold text-lg ${
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
                          className="text-base p-6 text-center text-lg"
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-6">
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
                            setCurrentStep(prev => prev + 1);
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
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-2 border-emerald-300 shadow-xl">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Welcome to the Four Under Club!</h2>
                    <p className="text-lg text-gray-600 mb-8">
                      You're now on the waitlist. We'll be in touch with details about membership, 
                      tee times, and how to start playing Rancho Park the Fast, Fun, and Fair way.
                    </p>
                    <div className="space-y-4">
                      <Button
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <a href="/game">
                          Try 4Points Now
                        </a>
                      </Button>
                      <p className="text-sm text-gray-500">
                        Start playing with the 4Points format today
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </section>

        {/* About Section */}
        {currentStep === 0 && (
          <section className="py-12 px-4 bg-white/50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Why Four Under?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <Clock className="w-10 h-10 text-emerald-600 mb-3" />
                    <CardTitle>Fast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Guaranteed sub-4-hour rounds at Rancho Park. No more waiting, no more slow play.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Zap className="w-10 h-10 text-blue-600 mb-3" />
                    <CardTitle>Fun</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Using 4Points scoring keeps the game engaging and competitive from first tee to 18th green.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Target className="w-10 h-10 text-purple-600 mb-3" />
                    <CardTitle>Fair</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Pace of play rules apply equally to everyone. Build a community that respects the game.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}