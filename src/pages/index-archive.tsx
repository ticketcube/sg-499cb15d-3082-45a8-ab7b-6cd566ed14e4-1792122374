import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Trophy, Users, Calendar, ArrowRight, Zap, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { surveyService } from "@/services/surveyService";
import { toast } from "@/hooks/use-toast";

interface SurveyAnswers {
  skill_level?: string;
  play_frequency?: string;
  preferred_format?: string;
  course_preference?: string;
  interests?: string[];
  email?: string;
  additional_feedback?: string;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({
    interests: []
  });

  const handleSurveyAnswer = (question: string, answer: string | string[]) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setSurveyAnswers(prev => {
      const currentInterests = prev.interests || [];
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    try {
      await surveyService.submitSurvey(surveyAnswers);
      toast({
        title: "Thank you!",
        description: "Your response has been recorded. We'll notify you when we launch!",
      });
      setCurrentStep(surveySteps.length);
    } catch (error) {
      console.error("Survey submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const surveySteps = [
    {
      question: "What's your golf skill level?",
      key: "skill_level",
      type: "radio",
      options: [
        { value: "beginner", label: "Beginner (New to golf)" },
        { value: "intermediate", label: "Intermediate (Casual player)" },
        { value: "advanced", label: "Advanced (Regular player)" },
        { value: "expert", label: "Expert (Competitive player)" }
      ]
    },
    {
      question: "How often do you play golf?",
      key: "play_frequency",
      type: "radio",
      options: [
        { value: "rarely", label: "Rarely (1-2 times/year)" },
        { value: "occasionally", label: "Occasionally (Monthly)" },
        { value: "regularly", label: "Regularly (Weekly)" },
        { value: "frequently", label: "Frequently (Multiple times/week)" }
      ]
    },
    {
      question: "What game format interests you most?",
      key: "preferred_format",
      type: "radio",
      options: [
        { value: "stroke_play", label: "Stroke Play (Traditional scoring)" },
        { value: "match_play", label: "Match Play (Hole-by-hole competition)" },
        { value: "stableford", label: "Stableford (Points-based)" },
        { value: "scramble", label: "Scramble (Team format)" }
      ]
    },
    {
      question: "Where do you prefer to play?",
      key: "course_preference",
      type: "radio",
      options: [
        { value: "public", label: "Public Courses" },
        { value: "private", label: "Private Clubs" },
        { value: "resort", label: "Resort Courses" },
        { value: "any", label: "Any Course" }
      ]
    },
    {
      question: "What features interest you? (Select all that apply)",
      key: "interests",
      type: "checkbox",
      options: [
        { value: "leaderboards", label: "Leaderboards & Rankings" },
        { value: "tournaments", label: "Tournament Play" },
        { value: "social", label: "Social Features" },
        { value: "stats", label: "Performance Statistics" },
        { value: "prizes", label: "Prizes & Rewards" },
        { value: "lessons", label: "Lessons & Tips" }
      ]
    },
    {
      question: "Almost done! How can we reach you?",
      key: "email",
      type: "email",
      placeholder: "your.email@example.com"
    },
    {
      question: "Any additional thoughts or suggestions?",
      key: "additional_feedback",
      type: "textarea",
      placeholder: "Tell us anything else you'd like us to know...",
      optional: true
    }
  ];

  const currentStepData = surveySteps[currentStep];
  const isLastStep = currentStep === surveySteps.length - 1;
  const canProceed = currentStepData?.optional || 
    (currentStepData?.type === "checkbox" ? (surveyAnswers.interests?.length || 0) > 0 : 
     surveyAnswers[currentStepData?.key as keyof SurveyAnswers]);

  return (
    <>
      <Head>
        <title>4Points Golf - Coming Soon</title>
        <meta name="description" content="Revolutionary golf gaming platform - Join the waitlist" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1),transparent_50%)]" />
          
          <div className="max-w-6xl mx-auto relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex justify-center mb-8">
                <Image 
                  src="/full-4unders-logo-mddg489f.png" 
                  alt="4Points Golf Logo" 
                  width={200} 
                  height={80}
                  className="h-20 w-auto"
                />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Golf Gaming,<br />Reimagined
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join the future of competitive golf. Play. Compete. Win.
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                <Zap className="w-5 h-5" />
                <span>Launching Soon - Join the Waitlist</span>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-6 mb-16"
            >
              <Card className="border-2 hover:border-emerald-300 transition-colors">
                <CardHeader>
                  <Trophy className="w-12 h-12 text-emerald-600 mb-4" />
                  <CardTitle>Compete Globally</CardTitle>
                  <CardDescription>
                    Challenge players worldwide in real-time tournaments
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle>Track Progress</CardTitle>
                  <CardDescription>
                    Advanced analytics and performance insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <Target className="w-12 h-12 text-purple-600 mb-4" />
                  <CardTitle>Win Prizes</CardTitle>
                  <CardDescription>
                    Earn rewards and compete for real prizes
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
                <Card className="max-w-2xl mx-auto border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500">
                        Question {currentStep + 1} of {surveySteps.length}
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
                    <CardTitle className="text-2xl">{currentStepData.question}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {currentStepData.type === "radio" && (
                      <RadioGroup
                        value={surveyAnswers[currentStepData.key as keyof SurveyAnswers] as string}
                        onValueChange={(value) => handleSurveyAnswer(currentStepData.key, value)}
                      >
                        {currentStepData.options?.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {currentStepData.type === "checkbox" && (
                      <div className="space-y-3">
                        {currentStepData.options?.map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center space-x-3 p-4 rounded-lg transition-colors cursor-pointer border-2 ${
                              surveyAnswers.interests?.includes(option.value)
                                ? "border-emerald-600 bg-emerald-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => handleInterestToggle(option.value)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              surveyAnswers.interests?.includes(option.value)
                                ? "border-emerald-600 bg-emerald-600"
                                : "border-gray-300"
                            }`}>
                              {surveyAnswers.interests?.includes(option.value) && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <Label className="flex-1 cursor-pointer text-base">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentStepData.type === "email" && (
                      <Input
                        type="email"
                        placeholder={currentStepData.placeholder}
                        value={surveyAnswers.email || ""}
                        onChange={(e) => handleSurveyAnswer("email", e.target.value)}
                        className="text-base p-6"
                      />
                    )}

                    {currentStepData.type === "textarea" && (
                      <Textarea
                        placeholder={currentStepData.placeholder}
                        value={surveyAnswers.additional_feedback || ""}
                        onChange={(e) => handleSurveyAnswer("additional_feedback", e.target.value)}
                        rows={4}
                        className="text-base"
                      />
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
                          if (isLastStep) {
                            handleSubmitSurvey();
                          } else {
                            setCurrentStep(prev => prev + 1);
                          }
                        }}
                        disabled={!canProceed || isSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isSubmitting ? "Submitting..." : isLastStep ? "Submit" : "Next"}
                        {!isLastStep && <ArrowRight className="ml-2 w-4 h-4" />}
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
                <Card className="max-w-2xl mx-auto border-2 border-emerald-300 shadow-xl">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">You're on the list!</h2>
                    <p className="text-lg text-gray-600 mb-8">
                      We'll notify you as soon as 4Points Golf launches. Get ready to tee off!
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>Join 1,000+ golfers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>Launching Q2 2026</span>
                      </div>
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