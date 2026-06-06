import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Target, Zap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface SurveyAnswers {
  round_duration?: string;
  last_score?: string;
  price_premium?: string;
  email?: string;
}

export default function FourUndersClub() {
  const [showSurvey, setShowSurvey] = useState(false);
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
          Play Rancho Park
          <br />
          in Under 4 Hours
        </h1>
        
        <div className="flex justify-center md:justify-start gap-4 text-lg md:text-xl font-semibold text-emerald-700">
          <span>Fast.</span>
          <span>Fun.</span>
          <span>Fair.</span>
        </div>
      </div>

    </div>

    {/* Subtitle */}
    <div className="text-center mb-10">
      <p className="max-w-xl mx-auto text-lg text-gray-600 leading-relaxed">
        Join golfers committed to restoring pace of play and creating
        a better Rancho Park experience for everyone.
      </p>
    </div>

    {/* Mission Card */}
    <Card className="mb-10 border border-gray-200 shadow-sm">
      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-5 text-center">
          Club Mission
        </h2>

        <div className="space-y-4">

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

      </CardContent>
    </Card>

    {/* CTA */}
    {!showSurvey && currentStep < surveySteps.length && (
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

      </motion.div>
    )}



            {/* Survey Section */}
            <AnimatePresence>
              {showSurvey && currentStep < surveySteps.length && (
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
                                    className={`cursor-pointer transition-all border-2 ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-50 shadow-md"
                                        : "border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                                    }`}
                                    onClick={() => handleAnswer(currentStepData.key, option.value)}
                                  >
                                    <CardContent className="p-4 md:p-6 text-center">
                                      <Icon className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 ${
                                        isSelected ? "text-emerald-600" : "text-gray-400"
                                      }`} />
                                      <p className={`font-semibold text-base md:text-lg ${
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

                                          <Link href="/game" className="block">
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
                                                  Try 4Points Now
                                              </Button>
                                          </Link>

                                          <p className="mt-4 text-sm text-gray-500">
                                              Start playing the Four Under format today
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